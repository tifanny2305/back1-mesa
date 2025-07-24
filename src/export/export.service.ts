import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { promisify } from 'util';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from 'src/rooms/entities/room.entity';
import { Repository } from 'typeorm';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class ExportService {
  templatePath = path.join(process.cwd(), 'export', 'templates', 'angular');
  exportTmpPath = path.join(process.cwd(), 'tmp-export');

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async exportRoomAsAngular(roomCode: string): Promise<string> {
    const room = await this.roomRepository.findOneBy({ code: roomCode });
    if (!room || !room.canvasFile) throw new Error(`No existe canvas para la sala: ${roomCode}`);

    const parsed = JSON.parse(room.canvasFile);
    const pages = Array.isArray(parsed) ? parsed : parsed.pages;

    if (!Array.isArray(pages)) {
      throw new Error('El formato del canvasFile no es un array de páginas.');
    }

    const projectName = `angular-${roomCode}`;
    const roomExportPath = path.join(this.exportTmpPath, projectName);
    fs.rmSync(roomExportPath, { recursive: true, force: true });
    fs.cpSync(this.templatePath, roomExportPath, { recursive: true });

    const pagesDir = path.join(roomExportPath, 'src', 'app', 'pages');
    await mkdirAsync(pagesDir, { recursive: true });

    let imports = '';
    let routes = `  { path: '', redirectTo: '${pages[0].name.toLowerCase().replace(/\s+/g, '-')}', pathMatch: 'full' },\n`;

    // Crear mapeo de páginas para redirección
    const pageMapping = pages.map(page => ({
      id: page.id,
      name: page.name,
      path: page.name.toLowerCase().replace(/\s+/g, '-')
    }));

    for (const page of pages) {
      const pageFolder = path.join(pagesDir, `page-${page.id}`);
      await mkdirAsync(pageFolder, { recursive: true });

      const htmlPath = path.join(pageFolder, `page-${page.id}.component.html`);
      const cssPath = path.join(pageFolder, `page-${page.id}.component.css`);
      const tsPath = path.join(pageFolder, `page-${page.id}.component.ts`);

      const { html, css } = this.convertComponentsToHtmlAndCss(page.components, pageMapping);
      
      await writeFileAsync(htmlPath, html);
      await writeFileAsync(cssPath, css);
      await writeFileAsync(tsPath, this.generateComponentTs(page.id));

      const normalizedPath = page.name.toLowerCase().replace(/\s+/g, '-');
      imports += `import { Page${this.normalizeId(page.id)}Component } from './pages/page-${page.id}/page-${page.id}.component';\n`;
      routes += `  { path: '${normalizedPath}', component: Page${this.normalizeId(page.id)}Component },\n`;
    }

    // ❌ ELIMINADO: Generación de navbar
    // const navbarDir = path.join(roomExportPath, 'src', 'app', 'components', 'navbar');
    // await mkdirAsync(navbarDir, { recursive: true });
    // await writeFileAsync(...);

    const routesPath = path.join(roomExportPath, 'src', 'app', 'app.routes.ts');
    let routesContent = await readFileAsync(routesPath, 'utf8');

    routesContent = imports + '\n' + routesContent;
    routesContent = routesContent.replace(
      'export const routes: Routes = [',
      `export const routes: Routes = [\n${routes}`
    );
    await writeFileAsync(routesPath, routesContent);

    // ❌ ELIMINADO: Referencia al navbar en app.component.html
    const appComponentHtmlPath = path.join(roomExportPath, 'src', 'app', 'app.component.html');
    await writeFileAsync(appComponentHtmlPath, `<router-outlet></router-outlet>`);

    const appComponentTsPath = path.join(roomExportPath, 'src', 'app', 'app.component.ts');
    await writeFileAsync(appComponentTsPath, this.generateAppComponentTs());

    const zipPath = path.join(this.exportTmpPath, `${projectName}.zip`);
    await this.zipDirectory(roomExportPath, zipPath, projectName);

    return zipPath;
  }

  private convertComponentsToHtmlAndCss(components: any[], pageMapping: any[]): { html: string; css: string } {
    let counter = 0;
    const cssMap = new Map<string, string>();

    const toKebabCase = (str: string): string =>
      str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    const render = (comp: any): string => {
      const className = `c${++counter}`;
      const styleString = Object.entries(comp.style || {})
        .filter(([key]) => !['redirectType', 'redirectValue', 'inputType'].includes(key))
        .map(([key, val]) => `${toKebabCase(key)}: ${val};`)
        .join(' ');
      cssMap.set(className, styleString);

      const tag = comp.type || 'div';
      const content = comp.content || '';
      const children = (comp.children || []).map(render).join('');

      switch (comp.type) {
        case 'button':
          let buttonContent = `<button class="${className}"`;
          if (comp.style?.redirectType === 'page') {
            const targetPage = pageMapping.find(p => p.id === comp.style.redirectValue);
            if (targetPage) {
              buttonContent += ` (click)="navigateToPage('${targetPage.path}')"`;
            }
          } else if (comp.style?.redirectType === 'url') {
            buttonContent += ` (click)="openUrl('${comp.style.redirectValue}')"`;
          }
          buttonContent += `>${content}</button>`;
          return buttonContent;

        case 'checklist':
          const inputType = comp.style?.inputType || 'checkbox';
          const checklistItems = comp.children?.map((item: any, index: number) => {
            const itemId = `${comp.id}_item_${index}`;
            const isChecked = item.checked ? 'checked' : '';
            const groupName = inputType === 'radio' ? `group_${comp.id}` : '';
            
            return `    <div class="checklist-item">
      <input type="${inputType}" 
             id="${itemId}" 
             ${inputType === 'radio' ? `name="${groupName}"` : ''} 
             ${isChecked}
             class="checklist-input">
      <label for="${itemId}" class="checklist-label">${item.content || ''}</label>
    </div>`;
          }).join('\n') || '';

          return `<div class="${className}">
${checklistItems}
</div>`;

        case 'select':
          const options = comp.children?.map((option: any) => 
            `    <option value="${option.content || ''}">${option.content || ''}</option>`
          ).join('\n') || '';
          return `<select class="${className}">
${options}
</select>`;

        case 'table':
          const tableRows = comp.children?.map((row: any) => {
            // Generar clase para la fila
            const rowClassName = `c${++counter}`;
            const rowStyleString = Object.entries(row.style || {})
              .map(([key, val]) => `${toKebabCase(key)}: ${val};`)
              .join(' ');
            if (rowStyleString) {
              cssMap.set(rowClassName, rowStyleString);
            }

            const cells = row.children?.map((cell: any) => {
              // Generar clase única para cada celda
              const cellClassName = `c${++counter}`;
              const cellStyleString = Object.entries(cell.style || {})
                .map(([key, val]) => `${toKebabCase(key)}: ${val};`)
                .join(' ');
              
              // Solo agregar CSS si hay estilos
              if (cellStyleString) {
                cssMap.set(cellClassName, cellStyleString);
              }
              
              return `      <td class="${cellClassName}">${cell.content || ''}</td>`;
            }).join('\n') || '';
            
            return `    <tr class="${rowClassName}">
${cells}
    </tr>`;
          }).join('\n') || '';
          
          return `<table class="${className}">
  <tbody>
${tableRows}
  </tbody>
</table>`;

        case 'label':
          return `<label class="${className}">${content}</label>`;

        default:
          return `<${tag} class="${className}">${content}${children}</${tag}>`;
      }
    };

    const html = `<div style="position: relative; width: 100%; height: 100vh;">
${components.map(render).join('\n')}
</div>`;

    // CSS adicional para checklist y tablas
    const additionalCss = `
/* Estilos para checklist */
.checklist-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.checklist-input {
  margin-right: 8px;
  cursor: pointer;
}

.checklist-label {
  cursor: pointer;
  user-select: none;
}

/* Estilos base para tablas */
table {
  border-collapse: collapse;
  table-layout: fixed;
}

td {
  box-sizing: border-box;
  vertical-align: top;
  padding: 8px;
  word-wrap: break-word;
}

tr {
  box-sizing: border-box;
}`;

    const css = Array.from(cssMap.entries())
      .map(([cls, styles]) => `.${cls} {\n  ${styles}\n}`)
      .join('\n\n') + '\n\n' + additionalCss;

    return { html, css };
  }

  private generateComponentTs(pageId: string): string {
    return `import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-${pageId}',
  templateUrl: './page-${pageId}.component.html',
  styleUrls: ['./page-${pageId}.component.css']
})
export class Page${this.normalizeId(pageId)}Component {
  
  constructor(private router: Router) {}

  navigateToPage(pagePath: string) {
    this.router.navigate(['/' + pagePath]);
  }

  openUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}`;
  }

  // ❌ ELIMINADO: generateNavbarTs()
  // ❌ ELIMINADO: generateNavbarHtml()
  // ❌ ELIMINADO: generateNavbarCss()

  private generateAppComponentTs(): string {
    return `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'export';
}`;
  }

  private normalizeId(id: string): string {
    return id.replace(/-/g, '');
  }

  private async zipDirectory(source: string, out: string, folderName: string): Promise<void> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(out);

    return new Promise((resolve, reject) => {
      archive
        .directory(source, folderName)
        .on('error', err => reject(err))
        .pipe(stream);
      stream.on('close', () => resolve());
      archive.finalize();
    });
  }

  

}
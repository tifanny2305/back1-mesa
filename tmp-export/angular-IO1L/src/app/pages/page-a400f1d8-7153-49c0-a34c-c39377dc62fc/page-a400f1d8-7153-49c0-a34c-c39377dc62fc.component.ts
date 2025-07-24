import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-a400f1d8-7153-49c0-a34c-c39377dc62fc',
  templateUrl: './page-a400f1d8-7153-49c0-a34c-c39377dc62fc.component.html',
  styleUrls: ['./page-a400f1d8-7153-49c0-a34c-c39377dc62fc.component.css']
})
export class Pagea400f1d8715349c0a34cc39377dc62fcComponent {
  
  constructor(private router: Router) {}

  navigateToPage(pagePath: string) {
    this.router.navigate(['/' + pagePath]);
  }

  openUrl(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-bebcd1db-5328-4ac0-99cc-5e168f0b7ecb',
  templateUrl: './page-bebcd1db-5328-4ac0-99cc-5e168f0b7ecb.component.html',
  styleUrls: ['./page-bebcd1db-5328-4ac0-99cc-5e168f0b7ecb.component.css']
})
export class Pagebebcd1db53284ac099cc5e168f0b7ecbComponent {
  
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
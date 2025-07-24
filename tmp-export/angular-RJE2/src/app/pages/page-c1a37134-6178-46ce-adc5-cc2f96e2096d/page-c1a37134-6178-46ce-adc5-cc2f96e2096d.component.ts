import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-c1a37134-6178-46ce-adc5-cc2f96e2096d',
  templateUrl: './page-c1a37134-6178-46ce-adc5-cc2f96e2096d.component.html',
  styleUrls: ['./page-c1a37134-6178-46ce-adc5-cc2f96e2096d.component.css']
})
export class Pagec1a37134617846ceadc5cc2f96e2096dComponent {
  
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
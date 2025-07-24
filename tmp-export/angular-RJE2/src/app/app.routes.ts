import { Pagec1a37134617846ceadc5cc2f96e2096dComponent } from './pages/page-c1a37134-6178-46ce-adc5-cc2f96e2096d/page-c1a37134-6178-46ce-adc5-cc2f96e2096d.component';
import { Pagebebcd1db53284ac099cc5e168f0b7ecbComponent } from './pages/page-bebcd1db-5328-4ac0-99cc-5e168f0b7ecb/page-bebcd1db-5328-4ac0-99cc-5e168f0b7ecb.component';

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'página-1', pathMatch: 'full' },
  { path: 'página-1', component: Pagec1a37134617846ceadc5cc2f96e2096dComponent },
  { path: 'página-2', component: Pagebebcd1db53284ac099cc5e168f0b7ecbComponent },


];

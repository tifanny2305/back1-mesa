import { Page7703c255c8b54ff09377bd97f69384c5Component } from './pages/page-7703c255-c8b5-4ff0-9377-bd97f69384c5/page-7703c255-c8b5-4ff0-9377-bd97f69384c5.component';
import { Pagedf1f286f72954c0fb4dc09c548dc3a4bComponent } from './pages/page-df1f286f-7295-4c0f-b4dc-09c548dc3a4b/page-df1f286f-7295-4c0f-b4dc-09c548dc3a4b.component';

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'página-1', pathMatch: 'full' },
  { path: 'página-1', component: Page7703c255c8b54ff09377bd97f69384c5Component },
  { path: 'página-2', component: Pagedf1f286f72954c0fb4dc09c548dc3a4bComponent },


];

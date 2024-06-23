import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ErrorPagesRoutingModule } from './error-pages-routing.module';
import { Error400Component } from './error400/error400.component';
import { Error401Component } from './error401/error401.component';
import { Error404P1Component } from './error404-p1/error404-p1.component';
import { Error404P2Component } from './error404-p2/error404-p2.component';
import { Error500Component } from './error500/error500.component';
import { Error503Component } from './error503/error503.component';
import { Error504Component } from './error504/error504.component';


@NgModule({
  declarations: [
    Error400Component,
    Error401Component,
    Error404P1Component,
    Error404P2Component,
    Error500Component,
    Error503Component,
    Error504Component
  ],
  imports: [
    CommonModule,
    ErrorPagesRoutingModule
  ],
  exports: [
    Error400Component,
    Error401Component,
    Error404P1Component,
    Error404P2Component,
    Error500Component,
    Error503Component,
    Error504Component
  ]
})
export class ErrorPagesModule { }

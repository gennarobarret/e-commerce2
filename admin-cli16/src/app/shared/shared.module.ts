import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './services/toast.service';
import { GeoInfoService } from './services/geo-info.service';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { MandalaComponent } from './components/mandala/mandala.component';
import { StringArtComponent } from './components/string-art/string-art.component';

@NgModule({
  declarations: [SpinnerComponent, MandalaComponent, StringArtComponent],
  imports: [CommonModule],
  providers: [ToastService, GeoInfoService],
  exports: [SpinnerComponent, MandalaComponent, StringArtComponent]
})
export class SharedModule { }

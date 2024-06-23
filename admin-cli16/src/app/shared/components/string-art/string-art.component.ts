// string-art.component.ts
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-string-art',
  templateUrl: './string-art.component.html',
  styleUrls: ['./string-art.component.css']
})
export class StringArtComponent implements AfterViewInit {
  @ViewChild('stringArtCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private points: { x: number; y: number }[] = [];
  private numPoints = 10;
  private radius = 250;
  private frame = 0;

  constructor() { }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Generate points around a circle
    for (let i = 0; i < this.numPoints; i++) {
      let angle = (i / this.numPoints) * Math.PI * 2;
      this.points.push({
        x: centerX + this.radius * Math.cos(angle),
        y: centerY + this.radius * Math.sin(angle)
      });
    }

    this.animate();
  }

  animate(): void {
    this.frame++;
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.ctx.beginPath();

    for (let i = 0; i < this.points.length; i++) {
      let angle = this.frame * 0.02 + (i / this.points.length) * Math.PI * 2;
      this.points[i].x = this.canvasRef.nativeElement.width / 2 + (this.radius + Math.sin(angle) * 20) * Math.cos(i / this.numPoints * Math.PI * 2);
      this.points[i].y = this.canvasRef.nativeElement.height / 2 + (this.radius + Math.sin(angle) * 20) * Math.sin(i / this.numPoints * Math.PI * 2);

      for (let j = 0; j < this.points.length; j++) {
        this.ctx.moveTo(this.points[i].x, this.points[i].y);
        this.ctx.lineTo(this.points[j].x, this.points[j].y);
      }
    }
    this.ctx.strokeStyle = '#000';
    this.ctx.stroke();

    requestAnimationFrame(() => this.animate());
  }
}

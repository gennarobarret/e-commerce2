import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-mandala',
  templateUrl: './mandala.component.html',
  styleUrls: ['./mandala.component.css']
})
export class MandalaComponent implements OnInit {
  @ViewChild('mandalaContainer', { static: true }) mandalaContainer!: ElementRef;

  constructor() { }

  ngOnInit(): void {
    this.drawMandala();
  }

  drawMandala(): void {
    const svgNS = "http://www.w3.org/2000/svg";
    let svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "800");
    svg.setAttribute("height", "800");
    this.mandalaContainer.nativeElement.appendChild(svg);

    const centerX = 400;
    const centerY = 400;
    const numElements = 20;
    const radius = 300;

    for (let i = 0; i < numElements; i++) {
      let angle = (Math.PI * 2 / numElements) * i;
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);

      let circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", x.toString());
      circle.setAttribute("cy", y.toString());
      circle.setAttribute("r", "20");
      circle.setAttribute("fill", "red");

      svg.appendChild(circle);
    }
  }
}

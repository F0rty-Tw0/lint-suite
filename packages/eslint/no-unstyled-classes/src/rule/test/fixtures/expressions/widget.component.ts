import { Component } from '@angular/core';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrl: './widget.component.scss'
})
export class WidgetComponent {
  public cond = false;
  public other = false;
  public dynamic = '';
  public interp = '';
  public kind = '';
}

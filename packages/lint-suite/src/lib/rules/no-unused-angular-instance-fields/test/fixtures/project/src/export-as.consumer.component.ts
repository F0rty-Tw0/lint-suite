// Scenario: the consuming component's external template reads the directive through #ref="appExportAs".
import { Component } from '@angular/core';
import { ExportAsDirective } from './export-as.directive';

@Component({
  selector: 'app-export-as-consumer',
  imports: [ExportAsDirective],
  templateUrl: './export-as.consumer.component.html'
})
export class ExportAsConsumerComponent {}

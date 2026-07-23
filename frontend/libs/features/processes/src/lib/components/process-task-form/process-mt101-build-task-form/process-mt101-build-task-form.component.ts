// @trace spec 008-mensajeria-pagos RF-001, T-011 (UI construccion MT101, base compartida por MT101_BUILD_FROM_TABLE)
// @trace ADR-009
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import {
  Mt101BuildTaskDraft,
  ProcessTaskExecutionMode,
  ProcessTaskBindingOption,
  ProcessTaskFormBridgeService,
} from '@integration-hub/core/providers';
import { I18nService, ProcessTaskManagerService } from '@integration-hub/core/services';
import { ProcessTaskBindingContextService } from '../../../forms/process-task-binding-context.service';
import { ProcessTaskFormModel, ReaderRef } from '../../../models/process.models';
import { ProcessDbWriteSourcePaletteComponent } from '../process-db-write-source-palette/process-db-write-source-palette.component';
import {
  Mt101BuildMappingField,
  Mt101BuildMappingTarget,
  ProcessMt101FieldMappingBoardComponent,
} from '../process-mt101-field-mapping-board/process-mt101-field-mapping-board.component';
import { ProcessTaskRuntimePanelComponent } from '../process-task-runtime-panel/process-task-runtime-panel.component';
import { TaskFormShellComponent } from '../task-form-shell/task-form-shell.component';

/**
 * Formulario de configuracion para la construccion MT101 (base compartida, usada por
 * {@code MT101_BUILD_FROM_TABLE}; el tipo en memoria {@code MT101_BUILD} se removio).
 *
 * <p>Componente standalone que se registra en {@code PROCESS_TASK_FORM_REGISTRY} via
 * {@code provideMt101BuildForm()}. El host lo instancia dinamicamente con
 * {@code ngComponentOutlet}; los patches al draft viajan al host por
 * {@link ProcessTaskFormBridgeService}.</p>
 */
@Component({
  selector: 'ih-process-mt101-build-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    ProcessDbWriteSourcePaletteComponent,
    ProcessMt101FieldMappingBoardComponent,
    ProcessTaskRuntimePanelComponent,
    TaskFormShellComponent,
  ],
  templateUrl: './process-mt101-build-task-form.component.html',
  styleUrl: './process-mt101-build-task-form.component.css',
})
export class ProcessMt101BuildTaskFormComponent {
  readonly i18n = inject(I18nService);
  private readonly manager = inject(ProcessTaskManagerService);
  private readonly bridge = inject(ProcessTaskFormBridgeService);
  private readonly bindingContext = inject(ProcessTaskBindingContextService);

  readonly task = input.required<ProcessTaskFormModel>();
  readonly tasks = input.required<readonly ProcessTaskFormModel[]>();
  readonly readers = input.required<readonly ReaderRef[]>();
  readonly readonly = input(false);
  readonly draggingSource = signal<ProcessTaskBindingOption | null>(null);

  readonly draft = computed<Mt101BuildTaskDraft>(
    () =>
      this.manager.draftFor<Mt101BuildTaskDraft>(this.task()),
  );

  readonly formatOptions: ReadonlyArray<'JSON' | 'XML' | 'FIN'> = ['JSON', 'XML', 'FIN'];
  readonly uetrStrategies: ReadonlyArray<{ value: string; labelKey: string }> = [
    { value: 'perMessage', labelKey: 'mt101.uetr.perMessage' },
    { value: 'fixed', labelKey: 'mt101.uetr.fixed' },
    { value: 'none', labelKey: 'mt101.uetr.none' },
  ];
  readonly orderingOptions = ['F', 'G', 'H'] as const;
  readonly instructingOptions = ['', 'L'] as const;
  readonly debitAccountModes: ReadonlyArray<'singleDebit' | 'multipleDebit' | 'subsidiary'> = [
    'singleDebit',
    'multipleDebit',
    'subsidiary',
  ];
  readonly buildExecutionModes: readonly ProcessTaskExecutionMode[] = ['once'];
  readonly servicingOptions: ReadonlyArray<'A' | 'C' | ''> = ['', 'A', 'C'];
  readonly transactionOrderingOptions: ReadonlyArray<'' | 'F' | 'G' | 'H'> = ['', 'F', 'G', 'H'];
  readonly beneficiaryOptions: ReadonlyArray<'' | 'A' | 'F'> = ['', 'A', 'F'];
  readonly splitStrategies: ReadonlyArray<'none' | 'debitAccount' | 'maxTransactions'> = [
    'none',
    'debitAccount',
    'maxTransactions',
  ];

  readonly sourceOptions = computed(() =>
    this.bindingContext.buildOptions(this.task(), this.tasks(), this.readers(), this.draft().input),
  );

  readonly sourceGroups = computed(() => this.bindingContext.groupOptions(this.sourceOptions()));
  readonly usesSequenceADebit = computed(() => this.draft().debitAccountMode === 'singleDebit');
  readonly usesTransactionDebit = computed(() => this.draft().debitAccountMode !== 'singleDebit');
  private readonly allMappingTargets: readonly Mt101BuildMappingTarget[] = [
    { field: 'amountCurrencyField', labelKey: 'mt101.mappings.amountCurrencyField', path: 'amount.currency', required: true, party: 'amount' },
    { field: 'amountValueField', labelKey: 'mt101.mappings.amountValueField', path: 'amount.value', required: true, party: 'amount' },
    { field: 'orderingCustomerAccountField', labelKey: 'mt101.mappings.orderingCustomerAccountField', path: 'orderingCustomer.account', party: 'ordering' },
    { field: 'orderingCustomerBicField', labelKey: 'mt101.mappings.orderingCustomerBicField', path: 'orderingCustomer.bic', party: 'ordering' },
    {
      field: 'orderingCustomerNameAddressFields',
      labelKey: 'mt101.mappings.orderingCustomerNameAddressFields',
      path: 'orderingCustomer.nameAndAddress',
      hintKey: 'mt101.mappingMultiHint',
      multi: true,
      party: 'ordering',
    },
    { field: 'accountServicingAccountField', labelKey: 'mt101.mappings.accountServicingAccountField', path: 'accountServicingInstitution.account', party: 'servicing' },
    { field: 'accountServicingBicField', labelKey: 'mt101.mappings.accountServicingBicField', path: 'accountServicingInstitution.bic', party: 'servicing' },
    { field: 'beneficiaryAccountField', labelKey: 'mt101.mappings.beneficiaryAccountField', path: 'beneficiary.account', party: 'beneficiary' },
    { field: 'beneficiaryBicField', labelKey: 'mt101.mappings.beneficiaryBicField', path: 'beneficiary.bic', party: 'beneficiary' },
    {
      field: 'beneficiaryNameAddressFields',
      labelKey: 'mt101.mappings.beneficiaryNameAddressFields',
      path: 'beneficiary.nameAndAddress',
      hintKey: 'mt101.mappingMultiHint',
      multi: true,
      party: 'beneficiary',
    },
    { field: 'accountWithBicField', labelKey: 'mt101.mappings.accountWithBicField', path: 'accountWithInstitution.bic', party: 'accountWith' },
    { field: 'remittanceInformationField', labelKey: 'mt101.mappings.remittanceInformationField', path: 'remittanceInformation', party: 'remittance' },
    { field: 'detailsOfChargesField', labelKey: 'mt101.mappings.detailsOfChargesField', path: 'detailsOfCharges', party: 'charges' },
  ];
  // Subconjuntos por parte MT101 -> cada tarjeta de Sequence B instancia el board con SU slice (+ showHeader=false).
  // Estaticos (allMappingTargets es const); la tarjeta "ordenante" se muestra condicional por debitAccountMode en el HTML.
  private targetsFor(party: string): Mt101BuildMappingTarget[] {
    return this.allMappingTargets.filter((target) => target.party === party);
  }
  readonly amountTargets = this.targetsFor('amount');
  readonly beneficiaryTargets = this.targetsFor('beneficiary');
  readonly accountWithTargets = this.targetsFor('accountWith');
  readonly orderingTargets = this.targetsFor('ordering');
  readonly servicingTargets = this.targetsFor('servicing');
  readonly remittanceTargets = [...this.targetsFor('remittance'), ...this.targetsFor('charges')];

  /**
   * Emite el draft completo cada vez que cambia. El parent NO escucha esto via
   * {@code @Output()} (incompatible con {@code ngComponentOutlet}); en su lugar el
   * {@link ProcessTaskFormBridgeService} entrega el patch.
   */
  updateDraft(patch: Partial<Mt101BuildTaskDraft>): void {
    const next: Mt101BuildTaskDraft = { ...this.draft(), ...patch };
    this.bridge.emit(this.manager.toTaskPatch(this.task().taskType, next));
  }

  updateEnvelope(patch: Partial<Mt101BuildTaskDraft['envelope']>): void {
    this.updateDraft({ envelope: { ...this.draft().envelope, ...patch } });
  }

  updateSequenceA(patch: Partial<Mt101BuildTaskDraft['sequenceA']>): void {
    this.updateDraft({ sequenceA: { ...this.draft().sequenceA, ...patch } });
  }

  updateMappings(patch: Partial<Mt101BuildTaskDraft['transactionMappings']>): void {
    this.updateDraft({
      transactionMappings: { ...this.draft().transactionMappings, ...patch },
    });
  }

  assignMapping(field: Mt101BuildMappingField, source: ProcessTaskBindingOption): void {
    const mappingKey = this.mappingKeyForSource(source);
    if (this.isMultiMapping(field)) {
      this.appendMappingValue(field, mappingKey);
      return;
    }
    this.setMappingValue(field, mappingKey);
  }

  setMappingValue(field: Mt101BuildMappingField, value: string): void {
    this.updateMappings({ [field]: value } as Partial<Mt101BuildTaskDraft['transactionMappings']>);
  }

  clearMapping(field: Mt101BuildMappingField): void {
    this.setMappingValue(field, '');
  }

  private appendMappingValue(field: Mt101BuildMappingField, value: string): void {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return;
    }
    const current = this.splitMappingValues(String(this.draft().transactionMappings[field] || ''));
    if (current.includes(normalized)) {
      return;
    }
    this.setMappingValue(field, [...current, normalized].join('\n'));
  }

  private isMultiMapping(field: Mt101BuildMappingField): boolean {
    return this.allMappingTargets.some((target) => target.field === field && target.multi);
  }

  private splitMappingValues(value: string): string[] {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private mappingKeyForSource(source: ProcessTaskBindingOption): string {
    if (source.kind === 'summary' || source.kind === 'out') {
      return this.bindingContext.tokenForOption(source, this.draft().input?.sourceTaskRef || '');
    }
    return source.key;
  }
}

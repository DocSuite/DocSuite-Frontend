import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeakerRenamePanelComponent } from './speaker-rename-panel.component';

describe('SpeakerRenamePanelComponent', () => {
  let component: SpeakerRenamePanelComponent;
  let fixture: ComponentFixture<SpeakerRenamePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeakerRenamePanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpeakerRenamePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit speaker draft changes', () => {
    spyOn(component.speakerDraftChange, 'emit');
    component.speakerDraft = { SPEAKER_00: 'SPEAKER_00' };

    component.onSpeakerNameChange('SPEAKER_00', 'Docente');

    expect(component.speakerDraftChange.emit).toHaveBeenCalledWith({ SPEAKER_00: 'Docente' });
  });
});

// ==========================================================================
// Modal Windows Coordinator - TestGenAI (Clean Architecture Façade)
// Resolves Finding #6: Deconstructs God Object into cohesive domain modal handlers
// ==========================================================================

import { ProjectModalHandler } from './modals/project-modals.js';
import { RequirementModalHandler } from './modals/requirement-modals.js';
import { AiModalHandler } from './modals/ai-modals.js';
import { TestCaseModalHandler } from './modals/testcase-modals.js';
import { NoAiModalHandler } from './modals/noai-modals.js';

export class ModalManager {
  constructor() {
    this.activeModal = null;
    this.projectModals = new ProjectModalHandler(this);
    this.requirementModals = new RequirementModalHandler(this);
    this.aiModals = new AiModalHandler(this);
    this.testCaseModals = new TestCaseModalHandler(this);
    this.noAiModals = new NoAiModalHandler(this);
  }

  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      this.activeModal = modal;
      document.body.style.overflow = 'hidden';
    }
  }

  close(modalId) {
    const modal = modalId ? document.getElementById(modalId) : this.activeModal;
    if (modal) {
      modal.classList.remove('open');
      if (this.activeModal === modal) {
        this.activeModal = null;
      }
      document.body.style.overflow = '';
    }
  }

  setupEventListeners() {
    // Backdrop click and close buttons
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close(overlay.id);
        }
      });

      const closeBtns = overlay.querySelectorAll('.modal-close, [data-modal-close]');
      closeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.close(overlay.id);
        });
      });
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });

    // Initialize specialized modal handlers
    this.projectModals.setup();
    this.requirementModals.setup();
    this.aiModals.setup();
    this.testCaseModals.setup();
    this.noAiModals.setup();
  }

  // Pre-fill Façade Methods
  populateEditProject(project) {
    this.projectModals.populateEditProject(project);
  }

  populateEditRequirement(requirement) {
    this.requirementModals.populateEditRequirement(requirement);
  }

  openAiGenModal(requirement) {
    this.aiModals.openAiGenModal(requirement);
  }

  populateEditTestCase(testCase) {
    this.testCaseModals.populateEditTestCase(testCase);
  }

  populateRejectTestCase(testCase) {
    this.testCaseModals.populateRejectTestCase(testCase);
  }

  // RF-15 & ISTQB Formal: Modals sin IA
  openManualModal(requirement) {
    this.noAiModals.openManualModal(requirement);
  }

  openTemplateModal(requirement) {
    this.noAiModals.openTemplateModal(requirement);
  }

  openBvaModal(requirement) {
    this.noAiModals.openBvaModal(requirement);
  }
}

export const modals = new ModalManager();

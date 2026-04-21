import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Offer } from '../../../models/offer.model';

@Component({
  selector: 'app-offer-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="offer" (click)="close.emit()">
      <div class="modal-glass" (click)="$event.stopPropagation()">
        <button class="glass-close" (click)="close.emit()">
          <i class="fas fa-times"></i>
        </button>

        <div class="modal-header">
          <div class="header-avatar">
            <i class="fas" [class.fa-pen]="mode === 'edit'" [class.fa-file-alt]="mode === 'view'"></i>
          </div>
          <div class="header-content">
            <h2>{{ mode === 'edit' ? 'Modifier l’offre' : 'Détails de l’offre' }}</h2>
            <p>{{ mode === 'edit' ? 'Mettez à jour les informations' : 'Consultez les informations complètes' }}</p>
          </div>
        </div>

        <div class="modal-body">
          <div class="input-group">
            <label><i class="fas fa-briefcase"></i> Intitulé du poste</label>
            <input type="text" [(ngModel)]="offerCopy.title" [readonly]="mode === 'view'" placeholder="Ex: Développeur Full Stack" />
          </div>

          <div class="input-group">
            <label><i class="fas fa-map-marker-alt"></i> Localisation</label>
            <input type="text" [(ngModel)]="offerCopy.location" [readonly]="mode === 'view'" placeholder="Paris, Lyon, Télétravail..." />
          </div>

          <div class="input-group">
            <label><i class="fas fa-align-left"></i> Description</label>
            <textarea rows="5" [(ngModel)]="offerCopy.description" [readonly]="mode === 'view'" placeholder="Missions, compétences, profil recherché..."></textarea>
          </div>

          <div class="toggle-group" *ngIf="mode === 'edit'">
            <div class="toggle-switch">
              <input type="checkbox" id="publishToggle" [(ngModel)]="offerCopy.published" />
              <label for="publishToggle"></label>
              <span class="toggle-label">
                <i class="fas" [class.fa-eye]="offerCopy.published" [class.fa-eye-slash]="!offerCopy.published"></i>
                {{ offerCopy.published ? 'Publiée' : 'Brouillon' }}
              </span>
            </div>
          </div>

          <div class="dates-card" *ngIf="mode === 'view'">
            <div class="date-item">
              <i class="fas fa-calendar-alt"></i>
              <div>
                <strong>Créée le</strong>
                <span>{{ formatDate(offerCopy.createDate) }}</span>
              </div>
            </div>
            <div class="date-item" *ngIf="offerCopy.updatedAt">
              <i class="fas fa-pen"></i>
              <div>
                <strong>Modifiée le</strong>
                <span>{{ formatDate(offerCopy.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-outline" (click)="close.emit()">
            <i class="fas fa-times"></i> Annuler
          </button>
          <button class="btn-gradient" *ngIf="mode === 'edit'" (click)="save.emit(offerCopy)">
            <i class="fas fa-save"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Backdrop animé - utilise les variables globales */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--modal-overlay, rgba(15, 23, 42, 0.6));
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      animation: fadeIn 0.2s cubic-bezier(0.2, 0.9, 0.4, 1.1);
    }

    @keyframes fadeIn {
      from { opacity: 0; backdrop-filter: blur(0); }
      to { opacity: 1; backdrop-filter: blur(8px); }
    }

    /* Modal avec effet glassmorphism - adapté au thème */
    .modal-glass {
      position: relative;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border-radius: 2rem;
      width: 90%;
      max-width: 640px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
      animation: slideScale 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.2);
    }

    @keyframes slideScale {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Bouton de fermeture flottant */
    .glass-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 1.1rem;
      transition: all 0.2s;
      z-index: 10;
      backdrop-filter: blur(4px);
    }

    .glass-close:hover {
      background: rgba(239, 68, 68, 0.15);
      color: var(--danger);
      transform: rotate(90deg) scale(1.05);
    }

    /* En-tête moderne */
    .modal-header {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      padding: 1.8rem 2rem 1rem 2rem;
      border-bottom: 1px solid var(--border-color);
    }

    .header-avatar {
      width: 56px;
      height: 56px;
      background: linear-gradient(145deg, var(--accent), var(--accent-dark));
      border-radius: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.8rem;
      box-shadow: 0 12px 20px -8px rgba(59, 130, 246, 0.4);
    }

    .header-content h2 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--text-primary), var(--accent-dark));
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      letter-spacing: -0.02em;
    }

    .header-content p {
      margin: 0.25rem 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* Corps du modal */
    .modal-body {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Groupes de champs */
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-group label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .input-group label i {
      color: var(--accent);
      width: 1.2rem;
    }

    .input-group input,
    .input-group textarea {
      width: 100%;
      padding: 0.8rem 1rem;
      font-size: 0.95rem;
      border: 1px solid var(--border-color);
      border-radius: 1rem;
      background: var(--bg-input);
      color: var(--text-primary);
      transition: all 0.2s;
      font-family: inherit;
    }

    .input-group input:focus,
    .input-group textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .input-group input[readonly],
    .input-group textarea[readonly] {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border-color: var(--border-color);
    }

    /* Toggle personnalisé */
    .toggle-group {
      margin-top: 0.5rem;
    }

    .toggle-switch {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .toggle-switch input {
      display: none;
    }

    .toggle-switch label {
      position: relative;
      width: 52px;
      height: 26px;
      background: var(--border-color);
      border-radius: 40px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-switch label::after {
      content: '';
      position: absolute;
      width: 22px;
      height: 22px;
      left: 2px;
      top: 2px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch input:checked + label {
      background: var(--accent);
    }

    .toggle-switch input:checked + label::after {
      transform: translateX(26px);
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    /* Carte des dates */
    .dates-card {
      background: var(--bg-secondary);
      border-radius: 1.2rem;
      padding: 1rem 1.2rem;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      border: 1px solid var(--border-color);
    }

    .date-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .date-item i {
      width: 32px;
      height: 32px;
      background: var(--bg-card);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      font-size: 0.9rem;
      box-shadow: var(--shadow-sm);
    }

    .date-item div {
      display: flex;
      flex-direction: column;
    }

    .date-item strong {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .date-item span {
      font-size: 0.85rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    /* Pied de page */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.2rem 2rem 2rem;
      border-top: 1px solid var(--border-color);
    }

    .btn-outline,
    .btn-gradient {
      padding: 0.6rem 1.3rem;
      border-radius: 2rem;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .btn-outline:hover {
      background: var(--bg-secondary);
      border-color: var(--border-color);
      transform: translateY(-1px);
    }

    .btn-gradient {
      background: linear-gradient(135deg, var(--accent), var(--accent-dark));
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-gradient:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }

    /* Scrollbar personnalisée */
    .modal-glass::-webkit-scrollbar {
      width: 6px;
    }
    .modal-glass::-webkit-scrollbar-track {
      background: var(--bg-secondary);
      border-radius: 10px;
    }
    .modal-glass::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 10px;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .modal-glass {
        width: 95%;
        max-height: 90vh;
      }
      .modal-header {
        padding: 1.2rem;
      }
      .modal-body {
        padding: 1.2rem;
      }
      .modal-footer {
        padding: 1rem;
      }
      .header-avatar {
        width: 44px;
        height: 44px;
        font-size: 1.4rem;
      }
      .header-content h2 {
        font-size: 1.3rem;
      }
    }
  `]
})
export class OfferDetailsModalComponent implements OnChanges {
  @Input() offer!: Offer;
  @Input() mode: 'view' | 'edit' = 'view';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Offer>();
  offerCopy: Offer = { title: '', description: '', location: '', published: false };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['offer'] && this.offer) {
      this.offerCopy = { ...this.offer };
      this.cdr.detectChanges();
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Non disponible';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }
}

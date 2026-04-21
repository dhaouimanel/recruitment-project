// application-helper.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApplicationHelperService {
  constructor() {}

  /**
   * Formate une date en français
   * @param dateString La date à formater
   * @param includeTime Inclure l'heure dans le format (défaut: true)
   * @returns La date formatée
   */
  formatDate(
    dateString: string | Date | undefined,
    includeTime: boolean = true,
  ): string {
    if (!dateString) return 'Date non disponible';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';

      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      };

      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }

      return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
      return 'Date non disponible';
    }
  }

  /**
   * Obtient le libellé d'un statut
   * @param status Le statut à traduire
   * @returns Le libellé du statut
   */
  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      A_CONTACTER: 'À contacter',
      RETENUE: 'Retenue',
      ENTRETIEN: 'Entretien',
      REJETE: 'Rejeté',
      RECRUTE: 'Recruté',
      ELIMINE: 'Éliminé',
      NON_TRAITE: 'Non traité',
    };
    return statusMap[status] || status;
  }

  /**
   * Obtient la classe CSS pour un statut
   * @param status Le statut
   * @returns La classe CSS
   */
  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      A_CONTACTER: 'status-pending',
      RETENUE: 'status-shortlisted',
      ENTRETIEN: 'status-interview',
      REJETE: 'status-rejected',
      RECRUTE: 'status-hired',
      ELIMINE: 'status-eliminated',
      NON_TRAITE: 'status-default',
    };
    return classMap[status] || 'status-default';
  }

  /**
   * Calcule le nombre de jours depuis une date
   * @param dateString La date de référence
   * @returns Le texte indiquant le nombre de jours
   */
  getDaysSince(dateString: string | Date | undefined): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
      if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
      return `Il y a ${Math.floor(diffDays / 365)} ans`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Obtient la durée depuis la création du compte
   * @param createDate La date de création
   * @returns La durée formatée
   */

  getMemberSince(dateString: string | Date | undefined): string {
    if (!dateString) return 'récemment';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `il y a ${diffDays} jours`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `il y a ${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `il y a ${years} an${years > 1 ? 's' : ''}`;
    }
  }

  /**
   * Télécharge un fichier blob
   * @param blob Le blob à télécharger
   * @param filename Le nom du fichier
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Gère les erreurs de téléchargement
   * @param error L'erreur
   * @param fileType Le type de fichier
   * @returns Le message d'erreur
   */
  handleDownloadError(error: any, fileType: string): string {
    console.error(`Erreur téléchargement ${fileType}:`, error);

    if (error.status === 404) {
      return `Le fichier ${fileType} n'a pas été trouvé`;
    } else if (error.status === 403) {
      return `Vous n'avez pas accès à ce fichier ${fileType}`;
    } else {
      return `Impossible de télécharger le ${fileType}`;
    }
  }

  /**
   * Filtre et trie des applications
   * @param applications Les applications à filtrer
   * @param searchTerm Le terme de recherche
   * @param statusFilter Le filtre de statut
   * @param sortBy La propriété pour le tri
   * @param sortDirection La direction du tri
   * @returns Les applications filtrées et triées
   */
  filterAndSortApplications(
    applications: any[],
    searchTerm: string = '',
    statusFilter: string = 'TOUS',
    sortBy: string = 'applicationDate',
    sortDirection: 'asc' | 'desc' = 'desc',
  ): any[] {
    let filtered = [...applications];

    if (statusFilter !== 'TOUS') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.offer?.title?.toLowerCase().includes(term) ||
          app.offer?.company?.toLowerCase().includes(term) ||
          app.offer?.reference?.toLowerCase().includes(term) ||
          app.candidate?.firstName?.toLowerCase().includes(term) ||
          app.candidate?.lastName?.toLowerCase().includes(term) ||
          app.candidate?.email?.toLowerCase().includes(term),
      );
    }

    filtered.sort((a, b) => {
      let aValue = this.getNestedValue(a, sortBy);
      let bValue = this.getNestedValue(b, sortBy);

      if (sortBy === 'applicationDate' || sortBy === 'statusDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  /**
   * Obtient une valeur imbriquée dans un objet
   * @param obj L'objet
   * @param path Le chemin de la propriété
   * @returns La valeur
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  /**
   * Calcule les statistiques des applications
   * @param applications Les applications
   * @returns Les statistiques
   */
  calculateApplicationStats(applications: any[]): {
    total: number;
    pending: number;
    shortlisted: number;
    interview: number;
    rejected: number;
    hired: number;
  } {
    return {
      total: applications.length,
      pending: applications.filter((app) => app.status === 'A_CONTACTER')
        .length,
      shortlisted: applications.filter((app) => app.status === 'RETENUE')
        .length,
      interview: applications.filter((app) => app.status === 'ENTRETIEN')
        .length,
      rejected: applications.filter((app) => app.status === 'REJETE').length,
      hired: applications.filter((app) => app.status === 'RECRUTE').length,
    };
  }

  /**
   * Génère des nombres de pages pour la pagination
   * @param currentPage La page actuelle
   * @param totalPages Le nombre total de pages
   * @returns Les numéros de page à afficher
   */
  getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          '...',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages,
        );
      }
    }

    return pages;
  }

  getTimeSince(dateString: string | Date | undefined): string {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        }
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays === 1) {
        return 'Hier';
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Il y a ${months} mois`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `Il y a ${years} an${years > 1 ? 's' : ''}`;
      }
    } catch (error) {
      return 'Date non disponible';
    }
  }
}

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterModule,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Offer } from '../../models/offer.model';
import { AuthService } from '../../auth/services/auth.service';
import { PublicOfferService } from '../../auth/services/public-offer.service';

type OfferWithScore = Offer & { searchScore?: number };

@Component({
  selector: 'app-public-offers',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './public-offers.component.html',
  styleUrls: ['./public-offers.component.scss'],
})
export class PublicOffersComponent implements OnInit, OnDestroy {
  offers: OfferWithScore[] = [];
  filteredOffers: OfferWithScore[] = [];
  searchTerm: string = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isLoggedIn = false;
  userRole = '';
  userRoleDisplay = '';
  lastUpdateDate: string = "Aujourd'hui";



  similarityThreshold: number = 0;
  showSimilarityScore: boolean = false;

  showDocumentationModal: boolean = false;
  documentationContent: any[] = [
    {
      title: 'Guide du Candidat',
      icon: 'fas fa-user-tie',
      description:
        'Apprenez à créer un profil attractif et à postuler efficacement',
      items: [
        'Comment créer un profil candidat complet',
        'Comment postuler à une offre',
        'Comment télécharger et gérer vos documents',
        'Comment suivre vos candidatures',
      ],
    },
    {
      title: 'FAQ - Questions Fréquentes',
      icon: 'fas fa-question-circle',
      description: 'Trouvez rapidement des réponses à vos questions',
      items: [
        'Comment réinitialiser mon mot de passe ?',
        'Quels documents sont acceptés ?',
        'Comment contacter le support ?',
        'Quelle est la politique de confidentialité ?',
      ],
    },
  ];

  modalContent: {
    title: string;
    sections: { heading: string; paragraphs: string[] }[];
  } | null = null;

  private modalContents: {
    [key: string]: {
      title: string;
      sections: { heading: string; paragraphs: string[] }[];
    };
  } = {
    'conseils-carriere': {
      title: 'Conseils carrière',
      sections: [
        {
          heading: 'Préparez votre candidature',
          paragraphs: [
            'Rédigez un CV clair et structuré, mettez en avant vos compétences clés.',
            'Personnalisez votre lettre de motivation pour chaque offre.',
            'Utilisez des mots-clés présents dans la description du poste.',
          ],
        },
        {
          heading: 'Réussissez vos entretiens',
          paragraphs: [
            'Préparez-vous en vous renseignant sur l’entreprise et le secteur.',
            'Entraînez-vous à répondre aux questions classiques (parcours, motivations, qualités/défauts).',
            'Préparez des questions pertinentes à poser à l’employeur.',
          ],
        },
        {
          heading: 'Développez votre réseau',
          paragraphs: [
            'Créez un profil LinkedIn attractif et connectez avec des professionnels de votre secteur.',
            'Participez à des événements (salons, conférences, webinaires).',
            'N’hésitez pas à contacter directement des recruteurs.',
          ],
        },
      ],
    },
    telechargements: {
      title: 'Téléchargements utiles',
      sections: [
        {
          heading: 'Modèles de documents',
          paragraphs: [
            'Téléchargez notre modèle de CV professionnel (Word / PDF).',
            'Modèle de lettre de motivation générique.',
            'Guide complet de préparation aux entretiens (PDF).',
          ],
        },
        {
          heading: 'Ressources pour recruteurs',
          paragraphs: [
            'Fiche de poste type à télécharger.',
            'Grille d’évaluation des candidats (Excel).',
            'Checklist pour un processus de recrutement efficace.',
          ],
        },
      ],
    },
    faq: {
      title: 'Foire aux questions',
      sections: [
        {
          heading: 'Candidats',
          paragraphs: [
            'Q : Comment postuler à une offre ? R : Connectez-vous, puis cliquez sur "Postuler" sur l’offre choisie.',
            'Q : Puis-je modifier mon profil ? R : Oui, depuis votre espace personnel.',
            'Q : Les offres sont-elles gratuites pour les candidats ? R : Oui, l’accès aux offres et la candidature sont totalement gratuits.',
          ],
        },
        {
          heading: 'Entreprises',
          paragraphs: [
            'Q : Comment publier une offre ? R : Contactez-nous pour ouvrir un compte recruteur.',
            'Q : Puis-je suivre les candidatures ? R : Oui, vous avez accès à un tableau de bord dédié.',
            'Q : Les données sont-elles sécurisées ? R : Oui, notre plateforme est conforme RGPD.',
          ],
        },
      ],
    },
    'mentions-legales': {
      title: 'Mentions légales',
      sections: [
        {
          heading: 'Éditeur du site',
          paragraphs: [
            'TalentRecruit, SAS au capital de 10 000 €',
            'Siège social : 123 Rue de la République, 75001 Paris',
            'SIRET : 123 456 789 00012',
          ],
        },
        {
          heading: 'Directeur de publication',
          paragraphs: ['M. Jean Dupont, PDG'],
        },
        {
          heading: 'Hébergement',
          paragraphs: [
            'Ce site est hébergé par OVH, 2 rue Kellermann, 59100 Roubaix',
          ],
        },
      ],
    },
    cgu: {
      title: 'Conditions générales d’utilisation',
      sections: [
        {
          heading: 'Objet',
          paragraphs: [
            'Les présentes CGU régissent l’utilisation de la plateforme TalentRecruit par les utilisateurs.',
          ],
        },
        {
          heading: 'Acceptation',
          paragraphs: [
            'L’utilisation du site implique l’acceptation pleine et entière des présentes conditions.',
          ],
        },
        {
          heading: 'Propriété intellectuelle',
          paragraphs: [
            'Tous les contenus du site sont protégés par le droit d’auteur.',
          ],
        },
      ],
    },
    'politique-confidentialite': {
      title: 'Politique de confidentialité',
      sections: [
        {
          heading: 'Données collectées',
          paragraphs: [
            'Nous collectons les informations que vous nous fournissez (nom, email, CV) et les données de navigation.',
          ],
        },
        {
          heading: 'Utilisation des données',
          paragraphs: [
            'Vos données sont utilisées pour vous proposer des offres adaptées et améliorer nos services.',
          ],
        },
        {
          heading: 'Sécurité',
          paragraphs: [
            'Nous mettons en œuvre des mesures techniques pour protéger vos données.',
          ],
        },
      ],
    },
    cookies: {
      title: 'Gestion des cookies',
      sections: [
        {
          heading: 'Qu’est-ce qu’un cookie ?',
          paragraphs: [
            'Un cookie est un petit fichier déposé sur votre terminal lors de la visite d’un site.',
          ],
        },
        {
          heading: 'Cookies utilisés',
          paragraphs: [
            'Cookies techniques : nécessaires au fonctionnement du site.',
            'Cookies analytiques : nous aident à comprendre comment vous utilisez le site (anonymes).',
          ],
        },
        {
          heading: 'Paramétrage',
          paragraphs: [
            'Vous pouvez gérer les cookies depuis les paramètres de votre navigateur.',
          ],
        },
      ],
    },
  };

  private routerSubscription: any;

  constructor(
    private publicOfferService: PublicOfferService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    console.log('=== PUBLIC OFFERS COMPONENT INIT ===');

    this.checkAuthStatus();

    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => {
          this.scrollToSection(fragment);
        }, 300);
      }
    });

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const tree = this.router.parseUrl(this.router.url);
        if (tree.fragment) {
          setTimeout(() => {
            this.scrollToSection(tree.fragment!);
          }, 200);
        }
      }
    });

    this.loadOffers();

    setTimeout(() => {
      this.onWindowScroll();
    }, 100);
  }

  openModal(type: string): void {
    this.modalContent = this.modalContents[type] || null;
    if (this.modalContent) {
      this.showDocumentationModal = true;
      document.body.style.overflow = 'hidden';
    }
  }

  openDocumentationModal(): void {
    const docContent = {
      title: 'Documentation & Guides',
      sections: [
        {
          heading: 'Guide du Candidat',
          paragraphs: this.documentationContent[0].items,
        },
        {
          heading: 'FAQ - Questions Fréquentes',
          paragraphs: this.documentationContent[1].items,
        },
      ],
    };
    this.modalContent = docContent;
    this.showDocumentationModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeDocumentationModal(): void {
    this.showDocumentationModal = false;
    this.modalContent = null;
    document.body.style.overflow = 'auto';
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToServices(): void {
    this.scrollToSection('services-section');
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    console.log('Utilisateur connecté:', this.isLoggedIn);

    if (this.isLoggedIn) {
      this.userRole = this.authService.getUserRole() || '';
      console.log('Rôle utilisateur brut:', this.userRole);

      this.userRoleDisplay = this.normalizeRoleForDisplay(this.userRole);
      console.log('Rôle affiché:', this.userRoleDisplay);
    }
  }

  loadOffers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.publicOfferService.getPublishedOffers().subscribe({
      next: (data: Offer[]) => {
        console.log('Données reçues du service:', data);

        this.offers = data.map((offer) => ({
          id: offer.id,
          title: offer.title || '',
          description: offer.description || '',
          location: offer.location || '',
          published: offer.published !== undefined ? offer.published : false,
          createDate: offer.createDate,
          updatedAt: offer.updatedAt || offer.createDate,
          searchScore: 1.0,
        }));

        console.log('Offres transformées:', this.offers);
        console.log("Nombre d'offres:", this.offers.length);

        this.filteredOffers = [...this.offers];
        this.calculateLastUpdateDate();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Impossible de charger les offres';
        this.isLoading = false;
        this.lastUpdateDate = "Aujourd'hui";
      },
    });
  }

  calculateLastUpdateDate(): void {
    console.log('=== DÉBUT calculateLastUpdateDate ===');
    console.log('this.offers:', this.offers);

    if (!this.offers || this.offers.length === 0) {
      console.log('Aucune offre disponible');
      this.lastUpdateDate = "Aujourd'hui";
      return;
    }

    const publishedOffers = this.offers.filter((offer) => offer.published);
    console.log('Offres publiées:', publishedOffers.length);

    if (publishedOffers.length === 0) {
      console.log('Aucune offre publiée');
      this.lastUpdateDate = "Aujourd'hui";
      return;
    }

    publishedOffers.forEach((offer, index) => {
      console.log(
        `Offre ${index} - ID: ${offer.id}, published: ${offer.published}, createDate: ${offer.createDate}, updatedAt: ${offer.updatedAt}`,
      );
    });

    const dates = publishedOffers.map((offer) => {
      const dateStr = offer.updatedAt || offer.createDate;
      console.log(`Date string: ${dateStr}`);
      return dateStr ? new Date(dateStr).getTime() : 0;
    });

    console.log('Dates converties en timestamp:', dates);

    const maxDate = Math.max(...dates);
    console.log('Timestamp maximum:', maxDate);

    if (maxDate <= 0) {
      console.log('Aucune date valide');
      this.lastUpdateDate = "Aujourd'hui";
      return;
    }

    const lastDate = new Date(maxDate);
    console.log('Dernière date (Date object):', lastDate);
    console.log(
      'Dernière date (formattée):',
      lastDate.toLocaleDateString('fr-FR'),
    );

    const today = new Date();
    console.log("Aujourd'hui:", today.toLocaleDateString('fr-FR'));

    const isToday =
      lastDate.getDate() === today.getDate() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getFullYear() === today.getFullYear();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      lastDate.getDate() === yesterday.getDate() &&
      lastDate.getMonth() === yesterday.getMonth() &&
      lastDate.getFullYear() === yesterday.getFullYear();

    console.log('isToday:', isToday);
    console.log('isYesterday:', isYesterday);

    if (isToday) {
      this.lastUpdateDate = "Aujourd'hui";
    } else if (isYesterday) {
      this.lastUpdateDate = 'Hier';
    } else {
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log('diffDays:', diffDays);

      if (diffDays < 7) {
        this.lastUpdateDate = `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        this.lastUpdateDate = `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
      } else {
        this.lastUpdateDate = this.formatLastUpdateDate(lastDate);
      }
    }

    console.log('lastUpdateDate final:', this.lastUpdateDate);
    console.log('=== FIN calculateLastUpdateDate ===');
  }

  formatLastUpdateDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) {
      return 'Date non disponible';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Date non disponible';
    }
  }

  truncateText(text: string, limit: number = 150): string {
    if (!text) return '';
    if (text.length <= limit) {
      return text;
    }
    return text.substring(0, limit) + '...';
  }

  normalizeRoleForDisplay(role: string): string {
    if (!role) return '';

    if (role.toUpperCase().startsWith('ROLE_')) {
      return role.substring(5);
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  normalizeRoleForCheck(role: string): string {
    if (!role) return '';

    const normalized = role.toUpperCase();
    if (normalized.startsWith('ROLE_')) {
      return normalized;
    }
    return 'ROLE_' + normalized;
  }

  canApply(): boolean {
    if (!this.isLoggedIn) {
      return false;
    }

    const normalizedRole = this.normalizeRoleForCheck(this.userRole);
    return normalizedRole === 'ROLE_CANDIDAT';
  }

  getSkills(offer: any): string[] {
    const skills = [];
    const text = (
      (offer.title || '') +
      ' ' +
      (offer.description || '')
    ).toLowerCase();

    if (
      text.includes('angular') ||
      text.includes('frontend') ||
      text.includes('typescript')
    ) {
      skills.push('Angular');
    }
    if (text.includes('react') || text.includes('javascript')) {
      skills.push('React');
    }
    if (
      text.includes('java') ||
      text.includes('spring') ||
      text.includes('backend')
    ) {
      skills.push('Java');
    }
    if (
      text.includes('python') ||
      text.includes('django') ||
      text.includes('flask')
    ) {
      skills.push('Python');
    }
    if (
      text.includes('sql') ||
      text.includes('database') ||
      text.includes('mysql')
    ) {
      skills.push('SQL');
    }
    if (
      text.includes('cloud') ||
      text.includes('aws') ||
      text.includes('azure')
    ) {
      skills.push('Cloud');
    }
    if (
      text.includes('agile') ||
      text.includes('scrum') ||
      text.includes('jira')
    ) {
      skills.push('Agile');
    }
    if (
      text.includes('node') ||
      text.includes('express') ||
      text.includes('api')
    ) {
      skills.push('Node.js');
    }
    if (
      text.includes('devops') ||
      text.includes('docker') ||
      text.includes('kubernetes')
    ) {
      skills.push('DevOps');
    }

    if (skills.length === 0) {
      return ['Communication', 'Travail en équipe', 'Autonomie'];
    }

    return skills.slice(0, 4);
  }

  navigateToApply(offerId: number): void {
    console.log("Navigation vers apply pour l'offre:", offerId);

    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: `/candidate/apply/${offerId}`,
          offerId: offerId,
        },
      });
      return;
    }

    if (this.canApply()) {
      this.router.navigate(['/candidate/apply', offerId]);
    } else {
      this.errorMessage = 'Seuls les candidats peuvent postuler aux offres';
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    }
  }

  scrollToOffers(): void {
    this.scrollToSection('offers-section');
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const navbar = document.querySelector('.navbar-fixed');
    if (navbar) {
      if (window.pageYOffset > 100) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = '';
    this.userRoleDisplay = '';

    this.router.navigate(['/offers']);
  }

  submitNewsletter(): void {
    const emailInput = document.querySelector(
      '.newsletter-input',
    ) as HTMLInputElement;
    if (emailInput && emailInput.value) {
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (emailRegex.test(email)) {
        this.successMessage =
          'Vous êtes maintenant inscrit à notre newsletter !';
        emailInput.value = '';

        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      } else {
        this.errorMessage = 'Veuillez entrer une adresse email valide';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    }
  }

  private tokenize(text: string): Set<string> {
    if (!text) return new Set();
    return new Set(
      text
        .toLowerCase()
        .split(/[\W_]+/)
        .filter((word) => word.length > 2),
    );
  }

  jaccardSimilarity(a: string, b: string): number {
    const setA = this.tokenize(a);
    const setB = this.tokenize(b);
    if (setA.size === 0 && setB.size === 0) return 1.0;
    if (setA.size === 0 || setB.size === 0) return 0.0;

    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  private computeOfferScore(offer: Offer, term: string): number {
    if (!term.trim()) return 1.0;

    const lowerTerm = term.toLowerCase();

    const titleScore =
      this.jaccardSimilarity(offer.title || '', lowerTerm) * 0.5;
    const descScore =
      this.jaccardSimilarity(offer.description || '', lowerTerm) * 0.3;
    const locScore =
      this.jaccardSimilarity(offer.location || '', lowerTerm) * 0.2;

    return titleScore + descScore + locScore;
  }

  filterOffers(): void {
    const term = this.searchTerm.trim();

    if (!term) {
      this.filteredOffers = this.offers.map((offer) => ({
        ...offer,
        searchScore: 1.0,
      }));
    } else {
      let scored: OfferWithScore[] = this.offers.map((offer) => ({
        ...offer,
        searchScore: this.computeOfferScore(offer, term),
      }));

      if (this.similarityThreshold > 0) {
        scored = scored.filter(
          (offer) => offer.searchScore! >= this.similarityThreshold,
        );
      }

      scored.sort((a, b) => (b.searchScore || 0) - (a.searchScore || 0));
      this.filteredOffers = scored;
    }

    this.calculateLastUpdateDate();
  }

  getSimilarityColor(score: number): string {
    if (score >= 0.7) return '#4caf50';
    if (score >= 0.4) return '#ff9800';
    if (score >= 0.2) return '#ffc107';
    return '#f44336';
  }
}

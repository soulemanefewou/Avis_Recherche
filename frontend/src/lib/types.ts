export type Sexe = 'HOMME' | 'FEMME';

export type AvisStatut =
  | 'BROUILLON'
  | 'RECHERCHE'
  | 'RETROUVE_VIVANT'
  | 'RETROUVE_DECEDE'
  | 'RECHERCHE_CLOTUREE'
  | 'EN_ATTENTE_VALIDATION'
  | 'RETROUVE_EN_ATTENTE_CONFIRMATION'
  | 'REJETE';

export type AvisType = 'OFFICIEL' | 'CITOYEN';

export type ValidationStatut = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export type SignalementStatut = 'PUBLIE' | 'MASQUE';

export type MessageType = 'USER' | 'SYSTEM';

export type NotificationType =
  | 'MESSAGE'
  | 'SIGNALEMENT'
  | 'SIGNALEMENT_URGENT'
  | 'AVIS_PUBLIE'
  | 'AVIS_STATUT'
  | 'AVIS_REJETE'
  | 'AVIS_EN_ATTENTE'
  | 'NOUVEL_AVIS_REGION'
  | 'AVIS_A_VALIDER'
  | 'SUIVI_QUOTIDIEN'
  | 'DEMANDE_VALIDATION'
  | 'CONFIRMATION_RETROUVE'
  | 'MESSAGE_SIGNALE'
  | 'COMPTE_DESACTIVE'
  | 'COMPTE_REACTIVE'
  | 'SYSTEM';

export type ConversationStatut = 'ACTIVE' | 'LECTURE_SEULE' | 'ARCHIVEE';

export type ConversationType =
  | 'PROCHE_TEMOIN'
  | 'ADMIN_AUTEUR'
  | 'COMMISSARIAT_TEMOIN';

export type JustificatifType =
  | 'CARTE_IDENTITE'
  | 'PHOTO_AVEC_DISPARU'
  | 'ACTE_NAISSANCE'
  | 'DOCUMENT_COMMISSARIAT';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  lieuResidence?: string;
  photoProfil?: string;
  region?: Region;
  roles: string[];
  actif: boolean;
}

export interface Region {
  id: number;
  nom: string;
  code: string;
  villes?: Ville[];
}

export interface Ville {
  id: number;
  nom: string;
  region?: Region;
}

export interface Photo {
  id: number;
  nomOriginal: string;
  nomFichier: string;
  chemin: string;
  mimeType: string;
  taille: number;
  estPrincipale: boolean;
  url?: string;
}

export interface Commissariat {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  responsable: string;
  region?: Region;
  ville?: Ville;
}

export interface AvisRecherche {
  id: number;
  nom: string;
  prenom: string;
  sexe: Sexe;
  ageApprox: number;
  dateDisparition: string;
  dernierLieuVu: string;
  description: string;
  circonstances?: string;
  tenueVestimentaire?: string;
  signesParticuliers?: string;
  taille?: number;
  poids?: number;
  telephone: string;
  statut: AvisStatut;
  type: AvisType;
  actif: boolean;
  region?: Region;
  ville?: Ville;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
  auteur?: User;
  commissariat?: Commissariat;
  validationStatut?: ValidationStatut;
  dateValidation?: string;
  motifRejet?: string;
  suiviActif?: boolean;
  piecesJustificatives?: Justificatif[];
}

export interface Justificatif {
  id: number;
  type: JustificatifType;
  nomOriginal: string;
  chemin: string;
  mimeType: string;
  taille: number;
}

export type SignalementAuteur = {
  id: number;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
};

export interface Signalement {
  id: number;
  description: string;
  lieu: string;
  dateObservation: string;
  heureObservation?: string;
  telephoneContact?: string;
  commentaireSupplementaire?: string;
  photo?: string;
  video?: string;
  pieceJointe?: string;
  statut: SignalementStatut;
  auteur?: SignalementAuteur;
  createdAt: string;
}

export interface Conversation {
  id: number;
  statut: ConversationStatut;
  type: ConversationType;
  avisRecherche?: AvisRecherche;
  createurSignalement?: User;
  proprietaireAvis?: User;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  contenu: string;
  type: MessageType;
  lu: boolean;
  auteur?: User;
  conversation?: Conversation;
  signalePar?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  titre: string;
  contenu: string;
  type: NotificationType;
  lu: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: Pagination;
}

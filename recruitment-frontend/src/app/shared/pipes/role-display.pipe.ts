import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleDisplay',
  standalone: true,
})
export class RoleDisplayPipe implements PipeTransform {
  transform(role: string): string {
    if (!role) return 'Visiteur';

    const roleMap: { [key: string]: string } = {
      ROLE_ADMIN: 'Administrateur',
      ROLE_RH: 'Responsable RH',
      ROLE_CANDIDAT: 'Candidat',
      ROLE_RECRUTEUR: 'Recruteur',
      CANDIDAT: 'Candidat',
      ADMIN: 'Administrateur',
      RH: 'Responsable RH',
    };

    return roleMap[role] || role;
  }
}

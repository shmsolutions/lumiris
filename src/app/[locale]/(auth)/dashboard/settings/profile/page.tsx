import { redirect } from 'next/navigation';

/** Dados profissionais viraram a aba "Perfil" das Configurações. */
export default function ProfileRedirectPage() {
  redirect('/dashboard/settings/?tab=perfil');
}

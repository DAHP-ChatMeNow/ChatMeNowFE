import { redirect } from 'next/navigation';

export default async function RootPage() {
  const isAuthenticated = false; 

  if (!isAuthenticated) {
    redirect('/login'); 
  } else {
    redirect('/messages');
  }
}
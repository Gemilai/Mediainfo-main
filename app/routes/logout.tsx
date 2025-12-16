import { type ActionFunctionArgs, redirect } from 'react-router';
import { logout } from '../services/session.server';
import type { Route } from './+types/logout';

export async function action({ request }: ActionFunctionArgs) {
  return logout();
}

export async function loader() {
  return redirect('/');
}

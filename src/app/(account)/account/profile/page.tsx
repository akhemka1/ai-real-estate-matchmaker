"use client";

import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { mockUser } from "@/lib/mock-data";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user) ?? mockUser;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-muted-foreground">Manage your account settings</p>

      <div className="mt-8 rounded-lg border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.firstName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm capitalize text-muted-foreground">{user.role}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="mt-1">{user.email}</dd>
          </div>
          {user.phone && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
              <dd className="mt-1">{user.phone}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Member since
            </dt>
            <dd className="mt-1">
              {new Date(user.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-2">
          <Button variant="outline">Edit profile</Button>
          <Link href="/messages">
            <Button variant="ghost">Messages</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

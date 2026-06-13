"use client";

import { AppHeader, FooterNote } from "../../../components/AppHeader";
import { ProfilePanel } from "../../../components/profile/ProfilePanel";

export default function ProfilePage() {
  return (
    <>
      <AppHeader title="Profile" subtitle="Your verified zodiac shelf" />
      <ProfilePanel />
      <FooterNote>
        Holdings are public on-chain reads of official Zodiacs.org registry representations —
        symbolic context only.
      </FooterNote>
    </>
  );
}

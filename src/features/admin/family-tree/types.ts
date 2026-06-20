import type { FamilyRelationshipType, MemberGender, MemberStatus, VisibilityStatus } from "@prisma/client";

export type AdminFamilyTreeMember = {
  id: string;
  fullName: string | null;
  alias: string | null;
  initials: string;
  gender: MemberGender;
  visibility: VisibilityStatus;
  status: MemberStatus;
  isFamilyHead: boolean;
  city: string | null;
  profession: string | null;
  phone: string | null;
  branchLabel: string | null;
  dateOfBirth: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminFamilyTreeRelationship = {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: FamilyRelationshipType;
  createdAt: string;
  updatedAt: string;
};

export type AdminFamilyTreeStats = {
  totalMembers: number;
  activeMembers: number;
  relationshipCount: number;
  familyHeads: number;
  standaloneMembers: number;
};

export type AdminFamilyTreeWarning = {
  code: string;
  message: string;
  relationshipId?: string;
  memberId?: string;
};

export type AdminFamilyTreeChartResponse = {
  members: AdminFamilyTreeMember[];
  relationships: AdminFamilyTreeRelationship[];
  stats: AdminFamilyTreeStats;
  warnings: AdminFamilyTreeWarning[];
};

export type FamilyChartPerson = {
  id: string;
  data: {
    gender: "M" | "F";
    firstName: string;
    lastName: string;
    fullName: string;
    alias: string;
    initials: string;
    member: AdminFamilyTreeMember;
  };
  rels: {
    parents: string[];
    spouses: string[];
    children: string[];
  };
};

export type FamilyChartGraph = {
  persons: FamilyChartPerson[];
  warnings: AdminFamilyTreeWarning[];
};

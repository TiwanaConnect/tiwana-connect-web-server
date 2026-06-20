export type DirectoryTagDto = {
  id: string;
  name: string;
  slug: string;
  type: string;
  color?: string | null;
};

export type MobileDirectoryMemberDto = {
  id: string;
  displayName: string;
  name: string | null;
  alias: string | null;
  initials: string;
  gender: "male" | "female";
  city: string | null;
  profession: string | null;
  branchLabel: string | null;
  phone: string | null;
  bio: string | null;
  availabilityNote: string | null;
  tags: DirectoryTagDto[];
  isPrivate: boolean;
  isPresident?: boolean;
  isAdmin?: boolean;
};

export type AdminDirectoryMemberDto = {
  id: string;
  fullName: string | null;
  alias: string | null;
  displayName: string;
  initials: string;
  gender: string;
  visibility: string;
  status: string;
  city: string | null;
  profession: string | null;
  phone: string | null;
  branchLabel: string | null;
  directoryVisibility: string;
  showPhone: boolean;
  showCity: boolean;
  showProfession: boolean;
  allowHelpRequests: boolean;
  bio: string | null;
  availabilityNote: string | null;
  tags: DirectoryTagDto[];
};

export type MobileHelpRequestDto = {
  id: string;
  title: string;
  message: string;
  category: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "accepted" | "declined" | "completed" | "cancelled";
  fromMember: {
    id: string;
    displayName: string;
    initials: string;
  };
  toMember: {
    id: string;
    displayName: string;
    initials: string;
  };
  responseMessage: string | null;
  createdAt: string;
  respondedAt: string | null;
  completedAt: string | null;
};

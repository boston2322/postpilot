export type SessionUser = {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

export type {
  User,
  Company,
  CompanyMember,
  Subscription,
  SocialAccount,
  Post,
  Automation,
} from '@prisma/client'

export type {
  Role,
  PlanType,
  SubscriptionStatus,
  PostStatus,
  Platform,
  AutomationFrequency,
} from '@prisma/client'

export type CompanyWithSubscription = {
  id: string
  name: string
  website: string | null
  logoUrl: string | null
  brandData: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  subscription: {
    id: string
    plan: string
    status: string
    postsUsedThisMonth: number
    currentPeriodEnd: Date | null
  } | null
  _count?: {
    members: number
    posts: number
  }
}

export type MemberWithUser = {
  id: string
  companyId: string
  userId: string
  role: string
  canApprove: boolean
  joinedAt: Date
  user: {
    id: string
    email: string
    name: string
    avatar: string | null
  }
}

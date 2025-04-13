export async function syncUserWithClerk(user, clerkUser) {
  // Extract user information from Clerk user object
  return {
    clerkId: user.id,
    firstName: user.firstName || clerkUser?.firstName,
    lastName: user.lastName || clerkUser?.lastName,
    username: user.username || clerkUser?.username,
    email: user.emailAddresses?.[0]?.emailAddress || clerkUser?.email,
    profileImageUrl: user.imageUrl || clerkUser?.profileImageUrl,
    profile_location: clerkUser?.profile_location || '',
    lastActiveAt: new Date()
  };
}
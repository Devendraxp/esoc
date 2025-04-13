export async function syncUserWithClerk(user, clerkUser) {
  // Extract primary email address from Clerk user object
  let primaryEmail = null;
  
  // Try to get email from user object first (from Clerk's current session)
  if (user.emailAddresses && user.emailAddresses.length > 0) {
    const primaryEmailObj = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId) 
                         || user.emailAddresses[0];
    primaryEmail = primaryEmailObj.emailAddress;
  }
  
  // If not found, try from the clerkUser (from database)
  if (!primaryEmail && clerkUser?.email) {
    primaryEmail = clerkUser.email;
  }
  
  // Extract user information from Clerk user object
  return {
    clerkId: user.id,
    firstName: user.firstName || clerkUser?.firstName,
    lastName: user.lastName || clerkUser?.lastName,
    username: user.username || clerkUser?.username,
    email: primaryEmail,
    profileImageUrl: user.imageUrl || clerkUser?.profileImageUrl,
    profile_location: clerkUser?.profile_location || '',
    lastActiveAt: new Date()
  };
}
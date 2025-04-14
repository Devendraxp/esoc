export async function syncUserWithClerk(clerkUser, existingUser = null) {
  // Extract primary email address from Clerk user
  let primaryEmail = null;
  
  if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
    const primaryEmailObj = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    ) || clerkUser.emailAddresses[0];
    
    primaryEmail = primaryEmailObj.emailAddress;
  }
  
  // Create a complete user object from Clerk data
  const userData = {
    clerkId: clerkUser.id,
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    username: clerkUser.username || '',
    email: primaryEmail,
    profileImageUrl: clerkUser.imageUrl || '',
    // Preserve existing user data if available
    profile_location: existingUser?.profile_location || '',
    bio: existingUser?.bio || '',
    role: existingUser?.role || 'normal',
    lastActiveAt: new Date()
  };
  
  // Keep any additional fields from the existing user
  if (existingUser) {
    // If existingUser is a Mongoose document, convert to plain object
    const existingUserData = existingUser.toObject ? existingUser.toObject() : existingUser;
    
    return {
      ...existingUserData,
      ...userData,
    };
  }
  
  return userData;
}
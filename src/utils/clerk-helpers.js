export async function syncUserWithClerk(clerkUser, existingUser = null) {

  let primaryEmail = null;

  if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
    const primaryEmailObj = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    ) || clerkUser.emailAddresses[0];

    primaryEmail = primaryEmailObj.emailAddress;
  }


  const userData = {
    clerkId: clerkUser.id,
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    username: clerkUser.username || '',
    email: primaryEmail,
    profileImageUrl: clerkUser.imageUrl || '',

    profile_location: existingUser?.profile_location || '',
    bio: existingUser?.bio || '',
    role: existingUser?.role || 'normal',
    lastActiveAt: new Date()
  };


  if (existingUser) {

    const existingUserData = existingUser.toObject ? existingUser.toObject() : existingUser;

    return {
      ...existingUserData,
      ...userData,
    };
  }

  return userData;
}

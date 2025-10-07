  const checkProfileCompletion = async (session: Session | null) => {
    if (!session) {
      setLoading(false);
      setNeedsProfileCompletion(false);
      return;
    }

    // Check if user has a client/coach profile by email
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (error || !client) {
      // No profile found - need to complete profile
      setNeedsProfileCompletion(true);
    } else {
      setNeedsProfileCompletion(false);
    }

    setLoading(false);
  };

const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');

// Find and replace the checkProfileCompletion function
const startMarker = 'const checkProfileCompletion = async (session: Session | null) => {';
const endMarker = '    setLoading(false);\n  };';

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.log('Could not find function start');
  process.exit(1);
}

const endIndex = content.indexOf(endMarker, startIndex);
if (endIndex === -1) {
  console.log('Could not find function end');
  process.exit(1);
}

const before = content.substring(0, startIndex);
const after = content.substring(endIndex + endMarker.length);

const newFunction = `const checkProfileCompletion = async (session: Session | null) => {
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
  };`;

content = before + newFunction + after;
fs.writeFileSync('App.tsx', content, 'utf8');
console.log('Fixed checkProfileCompletion function');

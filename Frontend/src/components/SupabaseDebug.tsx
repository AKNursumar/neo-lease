import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SupabaseDebug = () => {
  const { user, loading } = useSupabaseAuth();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (loading) {
    return <div>Loading Supabase connection...</div>;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Supabase Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Supabase URL:</strong> {supabaseUrl || "Not configured"}
        </div>
        <div>
          <strong>Anon Key:</strong> {supabaseAnonKey ? "✓ Configured" : "❌ Not configured"}
        </div>
        <div>
          <strong>User Status:</strong> {user ? "✓ Authenticated" : "❌ Not authenticated"}
        </div>
        {user && (
          <div>
            <strong>User Email:</strong> {user.email}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseDebug;

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      await refreshUser();
    } catch (error: any) {
      toast.error('Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully!');
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error('Failed to change password.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={profileData.first_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={profileData.last_name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profileData.email} disabled />
                <p className="text-sm text-gray-500">Contact an admin to change your email.</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                  disabled
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="bg-[#1e3a5f] hover:bg-[#152a45]"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                />
              </div>
              <p className="text-sm text-gray-500">
                Password must be at least 6 characters long.
              </p>
              <Button
                onClick={handleChangePassword}
                disabled={isUpdating}
                className="bg-[#1e3a5f] hover:bg-[#152a45]"
              >
                {isUpdating ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

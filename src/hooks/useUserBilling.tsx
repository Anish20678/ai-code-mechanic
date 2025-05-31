
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserBilling = Database['public']['Tables']['user_billing']['Row'];
type UserBillingUpdate = Database['public']['Tables']['user_billing']['Update'];

export const useUserBilling = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billing, isLoading } = useQuery({
    queryKey: ['userBilling'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_billing')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserBilling | null;
    },
  });

  const initializeBilling = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_billing')
        .insert({
          user_id: user.id,
          plan_name: 'free',
          status: 'trial',
          monthly_limit: 10.00,
          current_usage: 0.0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBilling'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBilling = useMutation({
    mutationFn: async (updates: Omit<UserBillingUpdate, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_billing')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBilling'] });
      toast({
        title: "Billing updated",
        description: "Your billing settings have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isNearLimit = () => {
    if (!billing) return false;
    return billing.current_usage >= billing.monthly_limit * 0.8;
  };

  const isOverLimit = () => {
    if (!billing) return false;
    return billing.current_usage >= billing.monthly_limit;
  };

  const getRemainingCredits = () => {
    if (!billing) return 0;
    return Math.max(0, billing.monthly_limit - billing.current_usage);
  };

  const getUsagePercentage = () => {
    if (!billing) return 0;
    return Math.min(100, (billing.current_usage / billing.monthly_limit) * 100);
  };

  return {
    billing,
    isLoading,
    initializeBilling,
    updateBilling,
    isNearLimit,
    isOverLimit,
    getRemainingCredits,
    getUsagePercentage,
  };
};

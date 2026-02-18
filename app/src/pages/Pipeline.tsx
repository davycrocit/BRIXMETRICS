import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Filter, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, startOfDay } from 'date-fns';
import type { PipelineDeal, Team, CandidateSource, DealClassification, DealStatus } from '@/types';

const candidateSources: CandidateSource[] = [
  'ATS',
  'LinkedIn Email',
  'LinkedIn CR Msg',
  'Zoominfo Cold Call',
  'Reply from Talent Bulletin',
  'Referral',
  'Applied via Website',
];

const classifications: DealClassification[] = [
  'Candidate Sourced 25%',
  'Candidate Submission 25%',
  'Client MP 25%',
  'Client JO 25%',
];

const statusColors: Record<DealStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  invoiced: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
};

export default function Pipeline() {
  const { user } = useAuth();
  const { canViewAllData, canViewTeamData } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState<Partial<PipelineDeal>>({
    company: '',
    job_title: '',
    candidate_name: '',
    amount: 0,
    invoice_number: '',
    invoice_date: null,
    payment_due_date: null,
    classification: 'Candidate Sourced 25%',
    is_retainer: false,
    candidate_source: 'ATS',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedTeam, selectedStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: teamsData } = await supabase.from('teams').select('*');
      setTeams(teamsData || []);

      let query = supabase
        .from('pipeline_deals')
        .select('*, recruiter:users(first_name, last_name), team:teams(name)')
        .order('payment_due_date', { ascending: true });

      if (selectedTeam !== 'all') {
        query = query.eq('team_id', selectedTeam);
      }
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      if (!canViewAllData() && user?.team_id) {
        query = query.eq('team_id', user.team_id);
      }

      const { data: dealsData } = await query;
      setDeals(dealsData || []);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!user?.team_id) {
      toast.error('You must be assigned to a team to create deals');
      return;
    }

    try {
      const { error } = await supabase.from('pipeline_deals').insert({
        company: newDeal.company,
        job_title: newDeal.job_title,
        candidate_name: newDeal.candidate_name,
        amount: newDeal.amount || 0,
        invoice_number: newDeal.invoice_number || null,
        invoice_date: newDeal.invoice_date || null,
        payment_due_date: newDeal.payment_due_date || null,
        classification: newDeal.classification || 'Candidate Sourced 25%',
        is_retainer: newDeal.is_retainer || false,
        candidate_source: newDeal.candidate_source || 'ATS',
        status: newDeal.status || 'pending',
        recruiter_id: user.id,
        team_id: user.team_id,
        notes: newDeal.notes,
      });

      if (error) throw error;

      toast.success('Deal added to pipeline!');
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      toast.error('Failed to add deal. Please try again.');
    }
  };

  const handleUpdateStatus = async (dealId: string, newStatus: DealStatus) => {
    try {
      const { error } = await supabase
        .from('pipeline_deals')
        .update({ status: newStatus })
        .eq('id', dealId);

      if (error) throw error;

      toast.success('Status updated!');
      await fetchData();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const resetForm = () => {
    setNewDeal({
      company: '',
      job_title: '',
      candidate_name: '',
      amount: 0,
      invoice_number: '',
      invoice_date: null,
      payment_due_date: null,
      classification: 'Candidate Sourced 25%',
      is_retainer: false,
      candidate_source: 'ATS',
      status: 'pending',
      notes: '',
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return isAfter(startOfDay(new Date()), startOfDay(new Date(dueDate)));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTotalPipeline = () => {
    return deals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500">Track deals and revenue</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-[#1e3a5f] hover:bg-[#152a45]">
            <Plus className="mr-2 h-4 w-4" />
            Add Deal
          </Button>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={newDeal.company}
                  onChange={(e) => setNewDeal({ ...newDeal, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newDeal.job_title}
                  onChange={(e) => setNewDeal({ ...newDeal, job_title: e.target.value })}
                  placeholder="Enter job title"
                />
              </div>
              <div className="space-y-2">
                <Label>Candidate Name</Label>
                <Input
                  value={newDeal.candidate_name}
                  onChange={(e) => setNewDeal({ ...newDeal, candidate_name: e.target.value })}
                  placeholder="Enter candidate name"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newDeal.amount || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={newDeal.invoice_number || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, invoice_number: e.target.value })}
                  placeholder="Enter invoice number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={newDeal.invoice_date || ''}
                    onChange={(e) => setNewDeal({ ...newDeal, invoice_date: e.target.value || null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Due Date</Label>
                  <Input
                    type="date"
                    value={newDeal.payment_due_date || ''}
                    onChange={(e) => setNewDeal({ ...newDeal, payment_due_date: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select
                  value={newDeal.classification}
                  onValueChange={(v) => setNewDeal({ ...newDeal, classification: v as DealClassification })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classifications.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Candidate Source</Label>
                <Select
                  value={newDeal.candidate_source}
                  onValueChange={(v) => setNewDeal({ ...newDeal, candidate_source: v as CandidateSource })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateSources.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_retainer"
                  checked={newDeal.is_retainer}
                  onCheckedChange={(checked) => setNewDeal({ ...newDeal, is_retainer: checked as boolean })}
                />
                <Label htmlFor="is_retainer">This is a retainer invoice</Label>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={newDeal.notes || ''}
                  onChange={(e) => setNewDeal({ ...newDeal, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
              <Button onClick={handleCreateDeal} className="w-full bg-[#1e3a5f] hover:bg-[#152a45]">
                Add Deal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pipeline</p>
              <p className="text-3xl font-bold">{formatCurrency(getTotalPipeline())}</p>
            </div>
            <div className="p-4 bg-[#1e3a5f] rounded-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {canViewAllData() && (
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="invoiced">Invoiced</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Company</th>
                  <th className="text-left py-3 px-4 font-semibold">Job Title</th>
                  <th className="text-left py-3 px-4 font-semibold">Candidate</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Invoice #</th>
                  <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Classification</th>
                  <th className="text-left py-3 px-4 font-semibold">Source</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                  {canViewTeamData() && <th className="text-center py-3 px-4 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => {
                  const overdue = isOverdue(deal.payment_due_date) && deal.status !== 'paid';
                  return (
                    <tr 
                      key={deal.id} 
                      className={`border-b hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-3 px-4 font-medium">{deal.company}</td>
                      <td className="py-3 px-4">{deal.job_title}</td>
                      <td className="py-3 px-4">{deal.candidate_name}</td>
                      <td className="text-right py-3 px-4 font-medium">{formatCurrency(deal.amount)}</td>
                      <td className="py-3 px-4">{deal.invoice_number || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {deal.payment_due_date ? format(new Date(deal.payment_due_date), 'MMM d, yyyy') : '-'}
                          {overdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{deal.classification}</Badge>
                      </td>
                      <td className="py-3 px-4">{deal.candidate_source}</td>
                      <td className="text-center py-3 px-4">
                        <Badge className={statusColors[deal.status]}>
                          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                        </Badge>
                      </td>
                      {canViewTeamData() && (
                        <td className="text-center py-3 px-4">
                          <Select
                            value={deal.status}
                            onValueChange={(v) => handleUpdateStatus(deal.id, v as DealStatus)}
                          >
                            <SelectTrigger className="w-32 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="invoiced">Invoiced</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {deals.length === 0 && (
                  <tr>
                    <td colSpan={canViewTeamData() ? 10 : 9} className="text-center py-8 text-gray-500">
                      No deals in pipeline
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

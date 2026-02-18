import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Team } from '@/types';

interface ForecastInputs {
  targetRevenue: number;
  avgPlacementFee: number;
  ftiToPlacementRate: number;
  subsToFtiRate: number;
  joToSubsRate: number;
  rpToJoRate: number;
  mpToJoRate: number;
}

interface ForecastResults {
  placementsNeeded: number;
  ftisNeeded: number;
  subsNeeded: number;
  josNeeded: number;
  rpsNeeded: number;
  mpsNeeded: number;
}

export default function Forecasting() {
  const { user } = useAuth();
  const { canViewAllData, canViewTeamData } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [inputs, setInputs] = useState<ForecastInputs>({
    targetRevenue: 500000,
    avgPlacementFee: 20000,
    ftiToPlacementRate: 4,
    subsToFtiRate: 3,
    joToSubsRate: 2,
    rpToJoRate: 5,
    mpToJoRate: 3,
  });
  const [results, setResults] = useState<ForecastResults | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    calculateForecast();
  }, [inputs]);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('teams').select('*');
      if (!canViewAllData() && user?.team_id) {
        query = query.eq('id', user.team_id);
      }
      const { data } = await query;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateForecast = () => {
    const placementsNeeded = Math.ceil(inputs.targetRevenue / inputs.avgPlacementFee);
    const ftisNeeded = Math.ceil(placementsNeeded * inputs.ftiToPlacementRate);
    const subsNeeded = Math.ceil(ftisNeeded * inputs.subsToFtiRate);
    const josNeeded = Math.ceil(subsNeeded / inputs.joToSubsRate);
    const rpsNeeded = Math.ceil(josNeeded * inputs.rpToJoRate);
    const mpsNeeded = Math.ceil(josNeeded * inputs.mpToJoRate);

    setResults({
      placementsNeeded,
      ftisNeeded,
      subsNeeded,
      josNeeded,
      rpsNeeded,
      mpsNeeded,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const handleInputChange = (field: keyof ForecastInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const saveForecast = async () => {
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;

      const goals = [
        { metric_type: 'sales', target_value: inputs.targetRevenue },
        { metric_type: 'fti', target_value: results?.ftisNeeded || 0 },
        { metric_type: 'jo', target_value: results?.josNeeded || 0 },
        { metric_type: 'rp', target_value: results?.rpsNeeded || 0 },
        { metric_type: 'mp', target_value: results?.mpsNeeded || 0 },
        { metric_type: 'subs', target_value: results?.subsNeeded || 0 },
      ];

      for (const goal of goals) {
        await supabase.from('goals').upsert({
          year,
          month,
          metric_type: goal.metric_type,
          target_value: goal.target_value,
        }, { onConflict: 'user_id,team_id,year,month,metric_type' });
      }

      toast.success('Forecast saved as monthly goals!');
    } catch (error) {
      toast.error('Failed to save forecast.');
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Forecasting</h1>
        <p className="text-gray-500">Calculate metrics needed to hit revenue targets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Forecast Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Monthly Revenue Target</Label>
              <Input
                type="number"
                value={inputs.targetRevenue}
                onChange={(e) => handleInputChange('targetRevenue', parseFloat(e.target.value) || 0)}
                min={0}
                step={1000}
              />
              <p className="text-sm text-gray-500">{formatCurrency(inputs.targetRevenue)}</p>
            </div>

            <div className="space-y-2">
              <Label>Average Placement Fee</Label>
              <Input
                type="number"
                value={inputs.avgPlacementFee}
                onChange={(e) => handleInputChange('avgPlacementFee', parseFloat(e.target.value) || 0)}
                min={0}
                step={1000}
              />
              <p className="text-sm text-gray-500">{formatCurrency(inputs.avgPlacementFee)}</p>
            </div>

            <div className="space-y-4">
              <Label className="font-semibold">Conversion Rates</Label>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">FTI to Placement Ratio</Label>
                  <span className="text-sm text-gray-500">1:{inputs.ftiToPlacementRate}</span>
                </div>
                <Slider
                  value={[inputs.ftiToPlacementRate]}
                  onValueChange={([v]) => handleInputChange('ftiToPlacementRate', v)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Subs to FTI Ratio</Label>
                  <span className="text-sm text-gray-500">{inputs.subsToFtiRate}:1</span>
                </div>
                <Slider
                  value={[inputs.subsToFtiRate]}
                  onValueChange={([v]) => handleInputChange('subsToFtiRate', v)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">JO to Subs Ratio</Label>
                  <span className="text-sm text-gray-500">1:{inputs.joToSubsRate}</span>
                </div>
                <Slider
                  value={[inputs.joToSubsRate]}
                  onValueChange={([v]) => handleInputChange('joToSubsRate', v)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">RP to JO Ratio</Label>
                  <span className="text-sm text-gray-500">{inputs.rpToJoRate}:1</span>
                </div>
                <Slider
                  value={[inputs.rpToJoRate]}
                  onValueChange={([v]) => handleInputChange('rpToJoRate', v)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">MP to JO Ratio</Label>
                  <span className="text-sm text-gray-500">{inputs.mpToJoRate}:1</span>
                </div>
                <Slider
                  value={[inputs.mpToJoRate]}
                  onValueChange={([v]) => handleInputChange('mpToJoRate', v)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>
            </div>

            {canViewAllData() && (
              <Button onClick={saveForecast} className="w-full bg-[#1e3a5f] hover:bg-[#152a45]">
                <Target className="mr-2 h-4 w-4" />
                Save as Monthly Goals
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Required Activity Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Placements Needed</p>
                    <p className="text-3xl font-bold text-blue-800">
                      {formatNumber(results.placementsNeeded)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">FTIs Needed</p>
                    <p className="text-3xl font-bold text-green-800">
                      {formatNumber(results.ftisNeeded)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Submissions Needed</p>
                    <p className="text-3xl font-bold text-purple-800">
                      {formatNumber(results.subsNeeded)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">Job Orders Needed</p>
                    <p className="text-3xl font-bold text-yellow-800">
                      {formatNumber(results.josNeeded)}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">RPs Needed</p>
                    <p className="text-3xl font-bold text-red-800">
                      {formatNumber(results.rpsNeeded)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600">MPs Needed</p>
                    <p className="text-3xl font-bold text-orange-800">
                      {formatNumber(results.mpsNeeded)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline Flow</CardTitle>
            </CardHeader>
            <CardContent>
              {results && (
                <div className="flex flex-wrap items-center justify-center gap-2 py-4">
                  <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">
                    {formatNumber(results.rpsNeeded)} RPs
                  </Badge>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <Badge className="bg-orange-100 text-orange-800 text-lg px-4 py-2">
                    {formatNumber(results.mpsNeeded)} MPs
                  </Badge>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2">
                    {formatNumber(results.josNeeded)} JOs
                  </Badge>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <Badge className="bg-purple-100 text-purple-800 text-lg px-4 py-2">
                    {formatNumber(results.subsNeeded)} Subs
                  </Badge>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                    {formatNumber(results.ftisNeeded)} FTIs
                  </Badge>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
                    {formatNumber(results.placementsNeeded)} Placements
                  </Badge>
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                  <Badge className="bg-emerald-100 text-emerald-800 text-lg px-4 py-2">
                    {formatCurrency(inputs.targetRevenue)}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {canViewTeamData() && teams.length > 0 && results && (
            <Card>
              <CardHeader>
                <CardTitle>Team Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Team</th>
                        <th className="text-right py-3 px-4 font-semibold">Revenue Target</th>
                        <th className="text-right py-3 px-4 font-semibold">Placements</th>
                        <th className="text-right py-3 px-4 font-semibold">FTIs</th>
                        <th className="text-right py-3 px-4 font-semibold">Subs</th>
                        <th className="text-right py-3 px-4 font-semibold">JOs</th>
                        <th className="text-right py-3 px-4 font-semibold">RPs</th>
                        <th className="text-right py-3 px-4 font-semibold">MPs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team) => {
                        const allocation = 1 / teams.length;
                        return (
                          <tr key={team.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{team.name}</td>
                            <td className="text-right py-3 px-4">
                              {formatCurrency(inputs.targetRevenue * allocation)}
                            </td>
                            <td className="text-right py-3 px-4">
                              {Math.ceil(results.placementsNeeded * allocation)}
                            </td>
                            <td className="text-right py-3 px-4">
                              {Math.ceil(results.ftisNeeded * allocation)}
                            </td>
                            <td className="text-right py-3 px-4">
                              {Math.ceil(results.subsNeeded * allocation)}
                            </td>
                            <td className="text-right py-3 px-4">
                              {Math.ceil(results.josNeeded * allocation)}
                            </td>
                            <td className="text-right py-3 px-4">
                              {Math.ceil(results.rpsNeeded * allocation)}
                            </td>
                            <td className="text-right py-3 px-4">
                              {Math.ceil(results.mpsNeeded * allocation)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

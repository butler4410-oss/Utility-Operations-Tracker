import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, TrendingUp, AlertCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { formatNumber } from "@/lib/utils";

interface EBillSend {
  id: string;
  clientId: string;
  accountNumber: string;
  recipientEmail: string;
  billDate: string;
  sendDate: string;
  deliveryStatus: string;
  openedAt: string | null;
  billAmount: string;
}

interface EBillStats {
  adoptionPercent: number;
  enrolled: number;
  delivered: number;
  bounced: number;
  pending: number;
}

export default function EBill() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: sends = [] } = useQuery<EBillSend[]>({
    queryKey: ['ebill-sends'],
    queryFn: async () => {
      const res = await fetch('/api/ebill-sends');
      if (!res.ok) throw new Error('Failed to fetch sends');
      return res.json();
    },
  });

  const { data: stats } = useQuery<EBillStats>({
    queryKey: ['ebill-stats'],
    queryFn: async () => {
      const res = await fetch('/api/ebill-stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const exceptions = sends.filter(s => s.deliveryStatus === 'Bounced');
  const filteredSends = sends.filter(send =>
    send.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    send.accountNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">eBill</h1>
          <p className="text-sm text-gray-600">Electronic billing delivery and tracking</p>
        </div>

        <Tabs defaultValue="statistics" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="statistics" data-testid="tab-statistics">Statistics</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">Jobs</TabsTrigger>
            <TabsTrigger value="exceptions" data-testid="tab-exceptions">
              Exceptions
              {exceptions.length > 0 && (
                <Badge className="ml-2 bg-red-600 text-white">{exceptions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" data-testid="tab-search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-5 w-5 text-brand-green" />
                  <span className="text-2xl font-bold text-gray-900">{stats?.adoptionPercent.toFixed(1)}%</span>
                </div>
                <p className="text-sm text-gray-600">Adoption Rate</p>
              </div>
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{formatNumber(stats?.enrolled || 0)}</span>
                </div>
                <p className="text-sm text-gray-600">Enrolled Accounts</p>
              </div>
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <Mail className="h-5 w-5 text-brand-green" />
                  <span className="text-2xl font-bold text-gray-900">{formatNumber(stats?.delivered || 0)}</span>
                </div>
                <p className="text-sm text-gray-600">Delivered (30d)</p>
              </div>
              <div className="bg-white border border-gray-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-gray-900">{formatNumber(stats?.bounced || 0)}</span>
                </div>
                <p className="text-sm text-gray-600">Bounced (30d)</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Recent Sends</h3>
              <div className="space-y-2">
                {sends.slice(0, 10).map(send => (
                  <div key={send.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100">
                    <div>
                      <div className="font-medium text-gray-900">{send.recipientEmail}</div>
                      <div className="text-xs text-gray-500">Account: {send.accountNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">{format(new Date(send.sendDate), 'MM/dd/yyyy')}</div>
                      <Badge className={send.deliveryStatus === 'Delivered' ? 'bg-brand-green/20 text-brand-green' : send.deliveryStatus === 'Bounced' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                        {send.deliveryStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-6">
              <p className="text-gray-600 text-center">eBill job batches and processing history</p>
            </div>
          </TabsContent>

          <TabsContent value="exceptions" className="space-y-4">
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-red-50">
                <h3 className="font-semibold text-red-900">Bounced Deliveries - Action Needed</h3>
                <p className="text-sm text-red-700">{exceptions.length} email{exceptions.length !== 1 ? 's' : ''} bounced</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Account</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Bill Date</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Send Date</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((send, idx) => (
                    <tr key={send.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} data-testid={`row-exception-${send.id}`}>
                      <td className="p-3 text-gray-700">{send.recipientEmail}</td>
                      <td className="p-3 text-gray-600">{send.accountNumber}</td>
                      <td className="p-3 text-xs text-gray-600">{format(new Date(send.billDate), 'MM/dd/yyyy')}</td>
                      <td className="p-3 text-xs text-gray-600">{format(new Date(send.sendDate), 'MM/dd/yyyy')}</td>
                      <td className="p-3 text-gray-700">${send.billAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-4">
              <Input
                placeholder="Search by email or account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
                data-testid="input-search-ebill"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Email</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Account</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Bill Date</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Send Date</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSends.slice(0, 50).map((send, idx) => (
                    <tr key={send.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="p-3 text-gray-700">{send.recipientEmail}</td>
                      <td className="p-3 text-gray-600">{send.accountNumber}</td>
                      <td className="p-3 text-xs text-gray-600">{format(new Date(send.billDate), 'MM/dd/yyyy')}</td>
                      <td className="p-3 text-xs text-gray-600">{format(new Date(send.sendDate), 'MM/dd/yyyy')}</td>
                      <td className="p-3">
                        <Badge className={send.deliveryStatus === 'Delivered' ? 'bg-brand-green/20 text-brand-green' : send.deliveryStatus === 'Bounced' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                          {send.deliveryStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {send.openedAt ? format(new Date(send.openedAt), 'MM/dd HH:mm') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MatrixLayout>
  );
}

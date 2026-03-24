import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";

interface BillMessage {
  id: string;
  templateId: string;
  clientId: string;
  messageText: string;
  alignment: string;
  fontFamily: string;
  charLimit: number;
  exceedsLimit: number;
  status: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function BillMessages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: messages = [], isLoading } = useQuery<BillMessage[]>({
    queryKey: ['bill-messages'],
    queryFn: async () => {
      const res = await fetch('/api/bill-messages');
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Sent to Approver': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-brand-green/20 text-brand-green',
      'Published': 'bg-purple-100 text-purple-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100'}>
        {status}
      </Badge>
    );
  };

  const filteredMessages = messages
    .filter(msg => filterStatus === "all" || msg.status === filterStatus)
    .filter(msg =>
      msg.messageText.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (isLoading) {
    return (
      <MatrixLayout>
        <div className="p-6">
          <div className="text-center py-8 text-gray-600">Loading messages...</div>
        </div>
      </MatrixLayout>
    );
  }

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">Bill Messages</h1>
            <p className="text-sm text-gray-600">Create and manage messages for utility bills</p>
          </div>
          <Button className="bg-[#1e3a5f] hover:bg-[#2c5282]" data-testid="button-new-message">
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              data-testid="input-search-messages"
            />
            <div className="flex gap-2">
              {['all', 'Draft', 'Sent to Approver', 'Approved', 'Published'].map(status => (
                <Button
                  key={status}
                  size="sm"
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  data-testid={`filter-${status.toLowerCase().replace(/ /g, '-')}`}
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700">Message Preview</th>
                <th className="text-left p-3 font-semibold text-gray-700">Client</th>
                <th className="text-left p-3 font-semibold text-gray-700">Font / Alignment</th>
                <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                <th className="text-left p-3 font-semibold text-gray-700">Created</th>
                <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg, idx) => (
                <tr
                  key={msg.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  data-testid={`row-message-${msg.id}`}
                >
                  <td className="p-3">
                    <div className="max-w-md">
                      <p className="text-xs text-gray-600 truncate">{msg.messageText}</p>
                      {msg.exceedsLimit === 1 && (
                        <span className="text-xs text-red-600">⚠ Exceeds {msg.charLimit} char limit</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-gray-700">Client #{msg.clientId.slice(0, 8)}</td>
                  <td className="p-3 text-xs text-gray-600">
                    <div>{msg.fontFamily}</div>
                    <div className="text-gray-500">{msg.alignment}</div>
                  </td>
                  <td className="p-3">{getStatusBadge(msg.status)}</td>
                  <td className="p-3 text-xs text-gray-600">
                    {format(new Date(msg.createdAt), 'MM/dd/yyyy')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7" data-testid={`button-view-${msg.id}`}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      {msg.status === 'Sent to Approver' && (
                        <>
                          <Button size="sm" className="h-7 bg-brand-green hover:bg-brand-green/90" data-testid={`button-approve-${msg.id}`}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-red-600" data-testid={`button-reject-${msg.id}`}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMessages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No messages found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </MatrixLayout>
  );
}

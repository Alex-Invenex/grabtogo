'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/components/providers/socket-provider';

interface Ticket {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  content: string;
  senderRole: 'VENDOR' | 'ADMIN';
  createdAt: string;
  attachments?: { url: string; name: string }[];
}

const STATUS_CONFIG = {
  OPEN: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Open' },
  IN_PROGRESS: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'In Progress' },
  RESOLVED: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Resolved' },
  CLOSED: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Closed' },
};

const PRIORITY_COLORS = {
  LOW: 'bg-gray-500',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

export default function VendorSupportPage() {
  const { toast } = useToast();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newTicketDialogOpen, setNewTicketDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New ticket form
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newDescription, setNewDescription] = useState('');

  // Message form
  const [message, setMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Socket.io listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('ticket:new_message', (data: { ticketId: string; message: Message }) => {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === data.ticketId
            ? { ...ticket, messages: [...ticket.messages, data.message], updatedAt: new Date().toISOString() }
            : ticket
        )
      );

      if (selectedTicket?.id === data.ticketId) {
        setSelectedTicket((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : null
        );
      }

      toast({
        title: 'New message',
        description: 'You have a new message from support',
      });
    });

    socket.on('ticket:status_updated', (data: { ticketId: string; status: string }) => {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === data.ticketId ? { ...ticket, status: data.status as any } : ticket
        )
      );

      if (selectedTicket?.id === data.ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: data.status as any } : null));
      }
    });

    return () => {
      socket.off('ticket:new_message');
      socket.off('ticket:status_updated');
    };
  }, [socket, selectedTicket, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/vendor/support/tickets');
      if (!response.ok) throw new Error('Failed to fetch tickets');

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newDescription.trim() || !newCategory) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);

      const response = await fetch('/api/vendor/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: newPriority,
          description: newDescription.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create ticket');

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Support ticket created successfully',
      });

      setNewTicketDialogOpen(false);
      setNewSubject('');
      setNewCategory('');
      setNewPriority('MEDIUM');
      setNewDescription('');

      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create support ticket',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicket) return;

    try {
      setSending(true);

      const response = await fetch(`/api/vendor/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.trim() }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === selectedTicket.id
            ? { ...ticket, messages: [...ticket.messages, data.message] }
            : ticket
        )
      );

      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, data.message] } : null
      );

      setMessage('');

      // Emit socket event
      if (socket) {
        socket.emit('ticket:send_message', {
          ticketId: selectedTicket.id,
          message: data.message,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-1">Get help from our support team</p>
        </div>
        <Button onClick={() => setNewTicketDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
              <CardDescription>{tickets.length} total tickets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">No support tickets yet</p>
                  <Button variant="link" onClick={() => setNewTicketDialogOpen(true)} className="mt-2">
                    Create your first ticket
                  </Button>
                </div>
              ) : (
                tickets.map((ticket) => {
                  const StatusIcon = STATUS_CONFIG[ticket.status].icon;

                  return (
                    <div
                      key={ticket.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{ticket.subject}</h4>
                          <p className="text-xs text-gray-600">{ticket.category}</p>
                        </div>
                        <Badge className={`${PRIORITY_COLORS[ticket.priority]} ml-2`}>
                          {ticket.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[ticket.status].color}`} />
                        <span className="text-xs">{STATUS_CONFIG[ticket.status].label}</span>
                        <span className="text-xs text-gray-600 ml-auto">
                          {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <CardDescription>Ticket #{selectedTicket.id.slice(0, 8)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${PRIORITY_COLORS[selectedTicket.priority]}`}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge variant="outline">
                      {STATUS_CONFIG[selectedTicket.status].label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderRole === 'VENDOR' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderRole === 'VENDOR'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderRole === 'VENDOR' ? 'text-white/70' : 'text-gray-600'
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={selectedTicket.status === 'CLOSED'}
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !message.trim() || selectedTicket.status === 'CLOSED'}>
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No ticket selected</h3>
                <p className="text-gray-600">Select a ticket to view the conversation</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={newTicketDialogOpen} onOpenChange={setNewTicketDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Our support team will respond as soon as possible
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TECHNICAL">Technical Issue</SelectItem>
                  <SelectItem value="BILLING">Billing & Payments</SelectItem>
                  <SelectItem value="ACCOUNT">Account Management</SelectItem>
                  <SelectItem value="PRODUCT">Product Listing</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={newPriority} onValueChange={(value) => setNewPriority(value as any)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about your issue..."
                rows={5}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

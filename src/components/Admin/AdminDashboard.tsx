"use client";

import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import moment from "moment";
import { PERMISSIONS } from "@/lib/permissions";
import { Search } from "lucide-react";

const getPermissionNames = (permInt: number) => {
  if (!permInt) return [];
  const names: string[] = [];
  for (const [key, value] of Object.entries(PERMISSIONS)) {
    if (typeof value === "number" && (permInt & value) === value) {
      names.push(key);
    }
  }
  return names;
};

interface AdminDashboardProps {
  logs: any[];
  users: any[];
}

export default function AdminDashboard({ logs, users }: AdminDashboardProps) {
  // Logs State
  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState("All");
  const [viewingLog, setViewingLog] = useState<any | null>(null);

  // Users State
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");

  // Filtered Logs
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action));
    return ["All", ...Array.from(actions)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        logSearch === "" ||
        log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.details?.toLowerCase().includes(logSearch.toLowerCase());

      const matchesFilter =
        logActionFilter === "All" || log.action === logActionFilter;

      return matchesSearch && matchesFilter;
    });
  }, [logs, logSearch, logActionFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        userSearch === "" ||
        user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase());

      let matchesFilter = true;
      if (userRoleFilter === "Super Admin") {
        matchesFilter = user.isSuperAdmin;
      } else if (userRoleFilter === "Staff") {
        matchesFilter = user.isStaff && !user.isSuperAdmin;
      } else if (userRoleFilter === "User") {
        matchesFilter = !user.isStaff && !user.isSuperAdmin;
      }

      return matchesSearch && matchesFilter;
    });
  }, [users, userSearch, userRoleFilter]);

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="logs">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>
                View all system actions and events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs (action, user, details)..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={logActionFilter}
                  onValueChange={setLogActionFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Action" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[600px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No logs found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="py-2">
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {log.user?.name || "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {log.user?.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] py-2">
                            {log.details ? (
                              <button
                                type="button"
                                onClick={() => setViewingLog(log)}
                                className="block w-full truncate text-left text-xs font-mono hover:text-primary hover:underline"
                                title="Click to view full details"
                              >
                                {log.details}
                              </button>
                            ) : null}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground py-2">
                            {moment(log.createdAt).format("MMM D, YYYY h:mm A")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4 text-xs text-muted-foreground text-right">
                Showing {filteredLogs.length} of {logs.length} logs
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage system users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users (name, email)..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={userRoleFilter}
                  onValueChange={setUserRoleFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Roles</SelectItem>
                    <SelectItem value="Super Admin">Super Admin</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[600px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Petitions</TableHead>
                      <TableHead>Signed</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No users found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium py-2">
                            {user.name || "No Name"}
                          </TableCell>
                          <TableCell className="py-2">{user.email}</TableCell>
                          <TableCell className="py-2">
                            {user.isSuperAdmin ? (
                              <Badge variant="destructive">Super Admin</Badge>
                            ) : user.isStaff ? (
                              <Badge variant="default">Staff</Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {user.permissions || 0}
                              </span>
                              {getPermissionNames(user.permissions || 0)
                                .length > 0 && (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {getPermissionNames(
                                    user.permissions || 0,
                                  ).map((p) => (
                                    <Badge
                                      key={p}
                                      variant="outline"
                                      className="text-[10px] h-4 px-1"
                                    >
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {user._count?.createdPetitions || 0}
                          </TableCell>
                          <TableCell className="py-2">
                            {user._count?.signedPetitions || 0}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {moment(user.createdAt).format("MMM D, YYYY")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4 text-xs text-muted-foreground text-right">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {viewingLog && (
        <Dialog open onOpenChange={() => setViewingLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingLog.action}</DialogTitle>
              <DialogDescription>
                {viewingLog.user?.name || "Unknown"}
                {viewingLog.user?.email ? ` (${viewingLog.user.email})` : ""}
                {" · "}
                {moment(viewingLog.createdAt).format("MMM D, YYYY h:mm A")}
              </DialogDescription>
            </DialogHeader>
            {/* Pretty-printed when the details parse as JSON, raw otherwise —
                details is a free-form string column. */}
            <pre className="max-h-[60vh] overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap break-all">
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(viewingLog.details),
                    null,
                    2,
                  );
                } catch {
                  return viewingLog.details;
                }
              })()}
            </pre>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

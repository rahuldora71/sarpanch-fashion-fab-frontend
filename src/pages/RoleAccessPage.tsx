import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  Users,
  History,
  Save,
  Check,
  Lock,
  Search,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getAllRoles,
  getRolePermissions,
  updateRolePermissions,
  getUsersWithAccess,
  assignUserRoles,
  getAuditLogs,
  type RoleDto,
  type RolePermissionMatrixDto,
  type RolePermissionItemDto,
  type UserAccessDto,
  type AuditAccessLogDto,
} from "@/services/rolePermissionService";
import { usePermissions } from "@/hooks/usePermissions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STANDARD_ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE", "PRINT", "EXPORT"];

export default function RoleAccessPage() {
  const { refreshPermissions } = usePermissions();

  const [activeTab, setActiveTab] = useState<"matrix" | "users" | "audit">("matrix");
  const [loading, setLoading] = useState(true);

  // Roles state
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  // Matrix state
  const [matrixData, setMatrixData] = useState<RolePermissionMatrixDto | null>(null);
  const [permissionStates, setPermissionStates] = useState<Record<number, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [resourceFilter, setResourceFilter] = useState("");

  // Users state
  const [users, setUsers] = useState<UserAccessDto[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserAccessDto | null>(null);
  const [selectedUserRoleIds, setSelectedUserRoleIds] = useState<number[]>([]);
  const [savingUserRoles, setSavingUserRoles] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditAccessLogDto[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const rolesData = await getAllRoles();
      setRoles(rolesData);

      if (rolesData.length > 0) {
        const defaultRole = rolesData.find((r) => r.name === "ROLE_SHOPKEEPER") || rolesData[0];
        setSelectedRoleId(defaultRole.id);
        await loadMatrix(defaultRole.id);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const loadMatrix = async (roleId: number) => {
    try {
      setLoading(true);
      const data = await getRolePermissions(roleId);
      setMatrixData(data);

      const states: Record<number, boolean> = {};
      data.permissions.forEach((p) => {
        states[p.permissionId] = p.granted;
      });
      setPermissionStates(states);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (roleId: number) => {
    setSelectedRoleId(roleId);
    await loadMatrix(roleId);
  };

  const togglePermission = (perm: RolePermissionItemDto) => {
    if (perm.locked) {
      toast.error("This permission is essential for administrator access and cannot be disabled");
      return;
    }
    setPermissionStates((prev) => ({
      ...prev,
      [perm.permissionId]: !prev[perm.permissionId],
    }));
  };

  // Row toggle: select all or deselect all actions for a resource
  const toggleResourceAll = (permsForResource: RolePermissionItemDto[]) => {
    const mutablePerms = permsForResource.filter((p) => !p.locked);
    if (mutablePerms.length === 0) return;

    const allCurrentlyGranted = mutablePerms.every((p) => permissionStates[p.permissionId]);
    const newState = !allCurrentlyGranted;

    setPermissionStates((prev) => {
      const next = { ...prev };
      mutablePerms.forEach((p) => {
        next[p.permissionId] = newState;
      });
      return next;
    });
  };

  // Column toggle: select all or deselect all resources for an action
  const toggleActionAll = (action: string) => {
    if (!matrixData) return;
    const matching = matrixData.permissions.filter(
      (p) => p.action.toUpperCase() === action.toUpperCase() && !p.locked
    );
    if (matching.length === 0) return;

    const allGranted = matching.every((p) => permissionStates[p.permissionId]);
    const newState = !allGranted;

    setPermissionStates((prev) => {
      const next = { ...prev };
      matching.forEach((p) => {
        next[p.permissionId] = newState;
      });
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      setSavingPermissions(true);
      await updateRolePermissions(selectedRoleId, {
        permissionsMap: permissionStates,
      });
      toast.success("Role permissions updated and saved to database");
      await refreshPermissions();
      await loadMatrix(selectedRoleId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  // Users Tab Handlers
  const loadUsersTab = async () => {
    try {
      setLoading(true);
      const data = await getUsersWithAccess();
      setUsers(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load user access list");
    } finally {
      setLoading(false);
    }
  };

  const openUserRoleModal = (user: UserAccessDto) => {
    setEditingUser(user);
    setSelectedUserRoleIds(user.roles.map((r) => r.id));
  };

  const toggleUserRole = (roleId: number) => {
    setSelectedUserRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSaveUserRoles = async () => {
    if (!editingUser) return;
    if (selectedUserRoleIds.length === 0) {
      toast.error("User must have at least one assigned role");
      return;
    }

    try {
      setSavingUserRoles(true);
      await assignUserRoles(editingUser.id, selectedUserRoleIds);
      toast.success(`Roles updated for ${editingUser.name}`);
      setEditingUser(null);
      await loadUsersTab();
      await refreshPermissions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update user roles");
    } finally {
      setSavingUserRoles(false);
    }
  };

  // Audit Tab Handlers
  const loadAuditTab = async () => {
    try {
      setLoadingAudit(true);
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoadingAudit(false);
    }
  };

  // Group matrix items by resource
  const groupedResources: Record<string, { resourceName: string; category: string; perms: RolePermissionItemDto[] }> = {};
  if (matrixData) {
    matrixData.permissions.forEach((p) => {
      if (!groupedResources[p.resourceKey]) {
        groupedResources[p.resourceKey] = {
          resourceName: p.resourceDisplayName || p.resourceKey,
          category: p.category || "General",
          perms: [],
        };
      }
      groupedResources[p.resourceKey].perms.push(p);
    });
  }

  const filteredResourceKeys = Object.keys(groupedResources).filter((resKey) => {
    const res = groupedResources[resKey];
    const matchName = res.resourceName.toLowerCase().includes(resourceFilter.toLowerCase());
    const matchCat = res.category.toLowerCase().includes(resourceFilter.toLowerCase());
    return matchName || matchCat;
  });

  const filteredAuditLogs = auditLogs.filter(
    (log) =>
      !auditSearch ||
      log.actorEmail?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.actionType?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.target?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Shield className="size-6 text-primary" />
            <span>Role & Page Access Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure dynamic permissions for ERP roles, assign access rights to staff, and monitor security changes.
          </p>
        </div>

        {activeTab === "matrix" && (
          <Button
            onClick={handleSavePermissions}
            disabled={savingPermissions || loading}
            className="rounded-xl h-10 px-5 gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
          >
            {savingPermissions ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving Matrix...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save Permissions</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val: any) => {
          setActiveTab(val);
          if (val === "users") loadUsersTab();
          if (val === "audit") loadAuditTab();
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 max-w-md w-full h-11 p-1 bg-muted/70 rounded-xl">
          <TabsTrigger value="matrix" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card">
            <ShieldCheck className="size-3.5 mr-1.5" />
            Permission Matrix
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card">
            <Users className="size-3.5 mr-1.5" />
            User Assignments
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card">
            <History className="size-3.5 mr-1.5" />
            Access Audit
          </TabsTrigger>
        </TabsList>

        {/* =========================================================
            TAB 1: PERMISSION MATRIX
        ========================================================= */}
        <TabsContent value="matrix" className="mt-4 space-y-4">
          {/* Role Selector Pills */}
          <Card className="rounded-2xl border border-border shadow-xs">
            <CardHeader className="py-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select User Role to Configure:
              </span>
              <div className="relative max-w-xs w-full">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  placeholder="Filter resources..."
                  className="h-8 pl-8 text-xs rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const isSelected = selectedRoleId === r.id;
                  const isSystemAdmin = r.name === "ROLE_OWNER" || r.name === "ROLE_ADMIN";

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleChange(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 scale-[1.02]"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {isSystemAdmin ? <Lock className="size-3" /> : <Shield className="size-3" />}
                      <span>{r.name.replace("ROLE_", "")}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Matrix Card */}
          <Card className="rounded-2xl border border-border shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/20">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>Resource & Operation Matrix</span>
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                    {matrixData?.roleName}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Checkboxes grant or deny operations for each page module. Changes take effect dynamically across all users with this role.
                </CardDescription>
              </div>

              {matrixData?.systemRole && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>Lockout Protection: Administrative security rights are protected.</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="size-7 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                        <th className="py-3 px-4 min-w-[200px]">ERP Module / Resource</th>
                        <th className="py-3 px-3 text-center w-24">Row All</th>
                        {STANDARD_ACTIONS.map((action) => (
                          <th key={action} className="py-3 px-3 text-center min-w-[85px]">
                            <button
                              type="button"
                              onClick={() => toggleActionAll(action)}
                              className="font-bold hover:text-primary transition-colors cursor-pointer text-[11px] underline decoration-dotted"
                              title={`Toggle all ${action} permissions`}
                            >
                              {action}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredResourceKeys.map((resKey) => {
                        const res = groupedResources[resKey];
                        const allRowGranted = res.perms
                          .filter((p) => !p.locked)
                          .every((p) => permissionStates[p.permissionId]);

                        return (
                          <tr key={resKey} className="hover:bg-accent/30 transition-colors">
                            {/* Resource info */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground text-xs">
                                {res.resourceName}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {resKey} • <span className="text-primary/70">{res.category}</span>
                              </div>
                            </td>

                            {/* Row Select All Toggle */}
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleResourceAll(res.perms)}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Toggle all actions for this resource"
                              >
                                {allRowGranted ? (
                                  <CheckSquare className="size-4 text-primary" />
                                ) : (
                                  <Square className="size-4 text-muted-foreground" />
                                )}
                              </button>
                            </td>

                            {/* Action columns */}
                            {STANDARD_ACTIONS.map((act) => {
                              const perm = res.perms.find(
                                (p) => p.action.toUpperCase() === act.toUpperCase()
                              );

                              if (!perm) {
                                return (
                                  <td key={act} className="py-3 px-3 text-center text-muted-foreground/30">
                                    —
                                  </td>
                                );
                              }

                              const isGranted = Boolean(permissionStates[perm.permissionId]);
                              const isLocked = perm.locked;

                              return (
                                <td key={act} className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => togglePermission(perm)}
                                    disabled={isLocked}
                                    className={`size-6 rounded-md inline-flex items-center justify-center transition-all cursor-pointer ${
                                      isLocked
                                        ? "bg-primary/20 text-primary border border-primary/40 cursor-not-allowed opacity-90"
                                        : isGranted
                                        ? "bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                                        : "bg-muted/80 text-transparent border border-border/70 hover:border-primary/50"
                                    }`}
                                    title={
                                      isLocked
                                        ? "Protected System Privilege (Cannot be revoked from Administrator)"
                                        : `${perm.displayName}: ${isGranted ? "Granted" : "Denied"}`
                                    }
                                  >
                                    {isLocked ? (
                                      <Lock className="size-3" />
                                    ) : (
                                      <Check className={`size-3.5 stroke-[3] ${isGranted ? "opacity-100" : "opacity-0"}`} />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================
            TAB 2: USER ROLE ASSIGNMENTS
        ========================================================= */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <Card className="rounded-2xl border border-border shadow-xs">
            <CardHeader className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Staff Role Assignments</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  View and assign ERP security roles to system users and tailors.
                </CardDescription>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search staff by name or email..."
                  className="h-8 pl-8 text-xs rounded-xl"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Assigned Roles</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {users
                      .filter(
                        (u) =>
                          u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {u.name}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {u.email}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((r) => (
                                <Badge
                                  key={r.id}
                                  variant="secondary"
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20"
                                >
                                  {r.name.replace("ROLE_", "")}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {u.enable ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                                <span className="size-1.5 rounded-full bg-destructive" />
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUserRoleModal(u)}
                              className="rounded-xl h-7 px-2.5 text-xs gap-1"
                            >
                              <UserCheck className="size-3.5" />
                              <span>Assign Roles</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================
            TAB 3: AUDIT LOGS
        ========================================================= */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          <Card className="rounded-2xl border border-border shadow-xs">
            <CardHeader className="p-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Access & Permission Audit Log</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Complete historical record of permission changes, role reassignments, and security updates.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative max-w-xs w-full">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search audit events..."
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAuditTab}
                  disabled={loadingAudit}
                  className="rounded-xl h-8 text-xs gap-1.5 shrink-0"
                >
                  <RefreshCw className={`size-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          {auditSearch ? "No matching audit events found." : "No RBAC audit events recorded yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {log.actorEmail || "SYSTEM"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                              {log.actionType}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-foreground font-mono text-[11px]">
                            {log.target}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* =========================================================
          MODAL: EDIT USER ROLES
      ========================================================= */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Assign Roles</DialogTitle>
            <DialogDescription className="text-xs">
              Configure assigned roles for <span className="font-semibold text-foreground">{editingUser?.name}</span> ({editingUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            {roles.map((r) => {
              const isChecked = selectedUserRoleIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  onClick={() => toggleUserRole(r.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                    isChecked
                      ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                      : "border-border/70 hover:bg-accent/40 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="size-4" />
                    <span className="text-xs">{r.name.replace("ROLE_", "")}</span>
                  </div>
                  {isChecked ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )}
                </label>
              );
            })}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveUserRoles}
              disabled={savingUserRoles}
              className="rounded-xl gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              {savingUserRoles && <Loader2 className="size-3.5 animate-spin" />}
              <span>Save Roles</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

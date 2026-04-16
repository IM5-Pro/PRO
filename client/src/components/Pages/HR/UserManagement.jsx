import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiEdit2,
  FiKey,
  FiMail,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import {
  assignEmployeeDesignation,
  createAdminEmployee,
  createDesignation,
  fetchDepartments,
  fetchDesignations,
  fetchDesignationsByDepartment,
  fetchAdminEmployees,
  fetchAllAdminEmployees,
  fetchEmployeeProfile,
  resetEmployeePassword,
  toErrorMessage,
  updateAdminEmployee,
  updateEmployeeStatus,
} from '../../../services/adminOperationsApi';

const EMPTY_CREATE_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  department: '',
  designation: '',
  salary: '',
  joinDate: '',
  phoneNumber: '',
  accountRole: 'EMPLOYEE',
};

const EMPTY_EDIT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  managerId: '',
  department: '',
  designation: '',
  salary: '',
  joinDate: '',
  dateOfBirth: '',
  city: '',
  state: '',
  zipCode: '',
  addressLine: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
};

const toOptionId = (value) => String(value || '').trim();
const normalizeText = (value) => String(value || '').trim().toLowerCase();
const formatEmployeeEmail = (firstName, lastName) => {
  const normalize = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.|\.$/g, '');

  const first = normalize(firstName);
  const last = normalize(lastName);
  if (!first || !last) return '';
  return `${first}.${last}@ispace.com`;
};

const formatJoinDate = (value) => {
  if (!value) {
    return 'Join date not available';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Join date not available';
  }

  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

const toDepartmentOption = (department, index) => {
  const id = toOptionId(department?._id || department?.id || department?.code || `department-${index}`);
  const name = String(department?.name || department?.departmentName || '').trim();

  return {
    id,
    name,
    code: String(department?.code || '').trim(),
    status: String(department?.status || '').trim().toLowerCase(),
    isActive: department?.isActive !== false,
  }; 
};

const toDesignationOption = (designation, index) => {
  const id = toOptionId(designation?._id || designation?.id || `designation-${index}`);
  const name = String(designation?.name || '').trim();
  const departmentId = toOptionId(designation?.department?._id || designation?.departmentId || designation?.department);
  const departmentName = String(
    designation?.department?.name
    || designation?.departmentName
    || designation?.department
    || '',
  ).trim();
  const departmentCode = String(
    designation?.department?.code
    || designation?.departmentCode
    || '',
  ).trim();

  return {
    id,
    name,
    departmentId,
    departmentName,
    departmentCode,
    isActive: designation?.isActive !== false,
  };
};

const toEmployeeCard = (employee, index) => {
  const fullName = [employee?.firstName, employee?.lastName].filter(Boolean).join(' ').trim();
  return {
    id: employee?._id || employee?.id || `employee-${index}`,
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    name: fullName || employee?.name || 'Unknown Employee',
    email: employee?.email || 'N/A',
    phone: employee?.phoneNumber || employee?.phone || '',
    department: employee?.department || 'Unassigned',
    designation: employee?.designation || 'Unassigned',
    salary: employee?.salary ?? '',
    role: String(employee?.role || employee?.accountRole || 'EMPLOYEE').toUpperCase(),
    status: employee?.isActive === false ? 'inactive' : 'active',
    joinDate: employee?.joinDate || employee?.joiningDate || employee?.createdAt || '',
  };
};

const HRUserManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [banner, setBanner] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');
  const [editOriginalDesignationId, setEditOriginalDesignationId] = useState('');
  const [referenceLoading, setReferenceLoading] = useState(true);
  const [designationLookupLoading, setDesignationLookupLoading] = useState(false);
  const [createDesignationDraft, setCreateDesignationDraft] = useState('');
  const [editDesignationDraft, setEditDesignationDraft] = useState('');
  const [designationCreateLoading, setDesignationCreateLoading] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [isCreateEmailEdited, setIsCreateEmailEdited] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editingEmployeeMeta, setEditingEmployeeMeta] = useState({
    employeeCode: '',
    managerName: '',
    status: '',
  });
  const [lastTempPassword, setLastTempPassword] = useState('');
  const [createSuccessInfo, setCreateSuccessInfo] = useState(null);
  const [copiedCreatePassword, setCopiedCreatePassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managerOptions, setManagerOptions] = useState([]);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [managerOptionsLoading, setManagerOptionsLoading] = useState(false);

  const resetCreateForm = useCallback(() => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateDesignationDraft('');
    setIsCreateEmailEdited(false);
  }, []);

  const resetEditForm = useCallback(() => {
    setEditForm(EMPTY_EDIT_FORM);
    setEditingEmployeeId('');
    setEditOriginalDesignationId('');
    setEditingEmployeeMeta({ employeeCode: '', managerName: '', status: '' });
    setEditDesignationDraft('');
    setManagerSearchQuery('');
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchAdminEmployees(200);
      setEmployees(rows.map((employee, index) => toEmployeeCard(employee, index)));
      setBanner({ type: '', text: '' });
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load employees') });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const loadReferenceData = useCallback(async () => {
    setReferenceLoading(true);
    try {
      const [departmentRows, designationRows] = await Promise.all([
        fetchDepartments(),
        fetchDesignations(),
      ]);

      setDepartments(
        departmentRows
          .map((department, index) => toDepartmentOption(department, index))
          .filter((department) => department.name && department.isActive),
      );

      setDesignations(
        designationRows
          .map((designation, index) => toDesignationOption(designation, index))
          .filter((designation) => designation.name && designation.isActive),
      );
    } catch (error) {
      setBanner((previous) => {
        if (previous.type === 'error' && previous.text) {
          return previous;
        }

        return {
          type: 'error',
          text: toErrorMessage(error, 'Failed to load departments and designations'),
        };
      });
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const loadManagerOptions = useCallback(async () => {
    setManagerOptionsLoading(true);
    try {
      const rows = await fetchAllAdminEmployees(200);
      const mapped = rows
        .map((employee, index) => toEmployeeCard(employee, index))
        .filter((employee) => employee.id && employee.name)
        .sort((left, right) => left.name.localeCompare(right.name));
      setManagerOptions(mapped);
    } catch (error) {
      setManagerOptions([]);
      setBanner((previous) => {
        if (previous.type === 'error' && previous.text) {
          return previous;
        }
        return { type: 'error', text: toErrorMessage(error, 'Failed to load manager options') };
      });
    } finally {
      setManagerOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!editOpen) {
      return;
    }
    loadManagerOptions();
  }, [editOpen, loadManagerOptions]);

  const filteredManagerOptions = useMemo(() => {
    const normalizedQuery = normalizeText(managerSearchQuery);
    const excludedEmployeeId = toOptionId(editingEmployeeId);
    const rows = managerOptions.filter((employee) => toOptionId(employee.id) !== excludedEmployeeId);
    if (!normalizedQuery) {
      return rows;
    }
    return rows.filter((employee) => {
      return [
        employee.name,
        employee.email,
        employee.department,
        employee.designation,
      ].some((value) => normalizeText(value).includes(normalizedQuery));
    });
  }, [editingEmployeeId, managerOptions, managerSearchQuery]);

  const mergeDesignationRows = useCallback((rows) => {
    setDesignations((previous) => {
      const merged = new Map(previous.map((designation) => [designation.id, designation]));
      rows.forEach((designation, index) => {
        const mapped = toDesignationOption(designation, index);
        if (mapped.id && mapped.name) {
          merged.set(mapped.id, mapped);
        }
      });

      return [...merged.values()];
    });
  }, []);

  const designationNameById = useMemo(() => {
    return new Map(designations.map((designation) => [designation.id, designation.name]));
  }, [designations]);

  const designationIdByName = useMemo(() => {
    return new Map(
      designations.map((designation) => [normalizeText(designation.name), designation.id]),
    );
  }, [designations]);

  const employeesWithResolvedLabels = useMemo(() => {
    return employees.map((employee) => ({
      ...employee,
      designationLabel: designationNameById.get(String(employee.designation || '').trim()) || employee.designation || 'Unassigned',
    }));
  }, [designationNameById, employees]);

  const filteredEmployees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return employeesWithResolvedLabels.filter((employee) => {
        return departmentFilter === 'all' || employee.department === departmentFilter;
      });
    }

    return employeesWithResolvedLabels.filter((employee) => {
      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;

      const matchesSearch = (
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.department.toLowerCase().includes(query) ||
        employee.designationLabel.toLowerCase().includes(query)
      );

      return matchesDepartment && matchesSearch;
    });
  }, [departmentFilter, employeesWithResolvedLabels, searchQuery]);

  const availableDepartmentFilters = useMemo(() => {
    const uniqueDepartments = [...new Set(
      employeesWithResolvedLabels
        .map((employee) => String(employee.department || '').trim())
        .filter(Boolean),
    )].sort((left, right) => left.localeCompare(right));

    return ['all', ...uniqueDepartments];
  }, [employeesWithResolvedLabels]);

  const summaryCards = useMemo(() => {
    const total = employeesWithResolvedLabels.length;
    const active = employeesWithResolvedLabels.filter((employee) => employee.status === 'active').length;
    const inactive = total - active;
    const adminAccounts = employeesWithResolvedLabels.filter((employee) => employee.role !== 'EMPLOYEE').length;

    return [
      {
        id: 'total',
        label: 'Total Accounts',
        value: total,
        note: 'Visible user records',
        icon: FiUsers,
        tone: 'bg-slate-100 text-slate-700 border-slate-200',
      },
      {
        id: 'active',
        label: 'Active Accounts',
        value: active,
        note: 'Currently enabled',
        icon: FiUserCheck,
        tone: 'bg-blue-50 text-blue-700 border-blue-100',
      },
      {
        id: 'inactive',
        label: 'Inactive Accounts',
        value: inactive,
        note: 'Require reactivation',
        icon: FiUserX,
        tone: 'bg-slate-100 text-slate-600 border-slate-200',
      },
      {
        id: 'privileged',
        label: 'Privileged Roles',
        value: adminAccounts,
        note: 'Manager and HR admin accounts',
        icon: FiShield,
        tone: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      },
    ];
  }, [employeesWithResolvedLabels]);

  const departmentOptions = useMemo(() => {
    return departments
      .filter((department) => department.name && department.status !== 'inactive' && department.isActive)
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [departments]);

  const selectedCreateDepartmentRecord = useMemo(() => {
    const selectedDepartment = normalizeText(createForm.department);
    if (!selectedDepartment) {
      return null;
    }

    return departmentOptions.find((department) => {
      return [department.name, department.code, department.id].some(
        (candidate) => normalizeText(candidate) === selectedDepartment,
      );
    }) || null;
  }, [createForm.department, departmentOptions]);

  const createDesignationOptions = useMemo(() => {
    const selectedDepartment = normalizeText(createForm.department);
    const selectedDepartmentId = normalizeText(selectedCreateDepartmentRecord?.id);
    const matchingDesignations = selectedDepartment
      ? designations.filter((designation) => {
          return [designation.departmentId, designation.departmentName, designation.departmentCode].some(
            (candidate) => {
              const normalizedCandidate = normalizeText(candidate);
              if (!normalizedCandidate) {
                return false;
              }

              return normalizedCandidate === selectedDepartment
                || (selectedDepartmentId && normalizedCandidate === selectedDepartmentId);
            },
          );
        })
      : designations;

    return matchingDesignations.slice().sort((left, right) => left.name.localeCompare(right.name));
  }, [createForm.department, designations, selectedCreateDepartmentRecord]);

  const selectedEditDepartmentRecord = useMemo(() => {
    const selectedDepartment = normalizeText(editForm.department);
    if (!selectedDepartment) {
      return null;
    }

    return departmentOptions.find((department) => {
      return [department.name, department.code, department.id].some(
        (candidate) => normalizeText(candidate) === selectedDepartment,
      );
    }) || null;
  }, [departmentOptions, editForm.department]);

  const editDesignationOptions = useMemo(() => {
    const selectedDepartment = normalizeText(editForm.department);
    const selectedDepartmentId = normalizeText(selectedEditDepartmentRecord?.id);
    const matchingDesignations = selectedDepartment
      ? designations.filter((designation) => {
          return [designation.departmentId, designation.departmentName, designation.departmentCode].some(
            (candidate) => {
              const normalizedCandidate = normalizeText(candidate);
              if (!normalizedCandidate) {
                return false;
              }

              return normalizedCandidate === selectedDepartment
                || (selectedDepartmentId && normalizedCandidate === selectedDepartmentId);
            },
          );
        })
      : designations;

    return matchingDesignations.slice().sort((left, right) => left.name.localeCompare(right.name));
  }, [designations, editForm.department, selectedEditDepartmentRecord]);

  useEffect(() => {
    const selectedDepartmentId = selectedCreateDepartmentRecord?.id;
    if (!createOpen || !selectedDepartmentId) {
      return;
    }

    let active = true;

    const loadDepartmentDesignations = async () => {
      setDesignationLookupLoading(true);
      try {
        const rows = await fetchDesignationsByDepartment(selectedDepartmentId);
        if (!active) {
          return;
        }
        mergeDesignationRows(rows);
      } catch (error) {
        if (active) {
          setBanner((previous) => {
            if (previous.type === 'error' && previous.text) {
              return previous;
            }

            return {
              type: 'error',
              text: toErrorMessage(error, 'Failed to verify department designations from backend'),
            };
          });
        }
      } finally {
        if (active) {
          setDesignationLookupLoading(false);
        }
      }
    };

    loadDepartmentDesignations();

    return () => {
      active = false;
    };
  }, [createOpen, mergeDesignationRows, selectedCreateDepartmentRecord?.id]);

  useEffect(() => {
    const selectedDepartmentId = selectedEditDepartmentRecord?.id;
    if (!editOpen || !selectedDepartmentId) {
      return;
    }

    let active = true;

    const loadDepartmentDesignations = async () => {
      setDesignationLookupLoading(true);
      try {
        const rows = await fetchDesignationsByDepartment(selectedDepartmentId);
        if (!active) {
          return;
        }
        mergeDesignationRows(rows);
      } catch (error) {
        if (active) {
          setBanner((previous) => {
            if (previous.type === 'error' && previous.text) {
              return previous;
            }

            return {
              type: 'error',
              text: toErrorMessage(error, 'Failed to verify department designations from backend'),
            };
          });
        }
      } finally {
        if (active) {
          setDesignationLookupLoading(false);
        }
      }
    };

    loadDepartmentDesignations();

    return () => {
      active = false;
    };
  }, [editOpen, mergeDesignationRows, selectedEditDepartmentRecord?.id]);

  const isDesignationInDepartment = useCallback((designationId, departmentValue, departmentRecordId = '') => {
    const designation = designations.find((item) => item.id === designationId);
    if (!designation) {
      return false;
    }

    return [designation.departmentId, designation.departmentName, designation.departmentCode]
      .some((candidate) => {
        return normalizeText(candidate) === normalizeText(departmentValue)
          || normalizeText(candidate) === normalizeText(departmentRecordId);
      });
  }, [designations]);

  const setCreateValue = (field) => (event) => {
    const nextValue = event.target.value;

    if (field === 'email') {
      setIsCreateEmailEdited(true);
    }

    setCreateForm((previous) => {
      const nextForm = {
        ...previous,
        ...(field === 'designation'
          ? {
              designation: nextValue,
              department: (() => {
                const selectedDesignation = designations.find((designation) => designation.id === nextValue);
                if (!selectedDesignation) {
                  return previous.department;
                }

                return selectedDesignation.departmentName
                  || departmentOptions.find((department) => department.id === selectedDesignation.departmentId)?.name
                  || previous.department;
              })(),
            }
          : field === 'department'
            ? {
                department: nextValue,
                designation:
                  previous.designation
                  && !isDesignationInDepartment(previous.designation, nextValue, selectedCreateDepartmentRecord?.id)
                    ? ''
                    : previous.designation,
              }
            : {
                [field]: nextValue,
              }),
      };

      if ((field === 'firstName' || field === 'lastName') && !isCreateEmailEdited) {
        const generatedEmail = formatEmployeeEmail(
          field === 'firstName' ? nextValue : previous.firstName,
          field === 'lastName' ? nextValue : previous.lastName,
        );
        if (generatedEmail) {
          nextForm.email = generatedEmail;
        }
      }

      return nextForm;
    });
  };

  const setEditValue = (field) => (event) => {
    const nextValue = event.target.value;

    setEditForm((previous) => ({
      ...previous,
      ...(field === 'designation'
        ? {
            designation: nextValue,
            department: (() => {
              const selectedDesignation = designations.find((designation) => designation.id === nextValue);
              if (!selectedDesignation) {
                return previous.department;
              }

              return selectedDesignation.departmentName
                || departmentOptions.find((department) => department.id === selectedDesignation.departmentId)?.name
                || previous.department;
            })(),
          }
        : field === 'department'
          ? {
              department: nextValue,
              designation:
                previous.designation
                && !isDesignationInDepartment(previous.designation, nextValue, selectedEditDepartmentRecord?.id)
                  ? ''
                  : previous.designation,
            }
          : {
              [field]: nextValue,
            }),
    }));
  };

  const addDesignationForDepartment = async (mode) => {
    const isCreateFlow = mode === 'create';
    const selectedDepartment = isCreateFlow ? selectedCreateDepartmentRecord : selectedEditDepartmentRecord;
    const designationDraft = String(isCreateFlow ? createDesignationDraft : editDesignationDraft).trim();

    if (!selectedDepartment?.id) {
      setBanner({ type: 'error', text: 'Select a department before adding a designation.' });
      return;
    }

    if (!designationDraft) {
      setBanner({ type: 'error', text: 'Enter a designation name before adding.' });
      return;
    }

    setDesignationCreateLoading(mode);
    setBanner({ type: '', text: '' });

    try {
      const createdDesignation = await createDesignation({
        name: designationDraft,
        department: selectedDepartment.id,
        level: 1,
      });

      mergeDesignationRows([createdDesignation]);

      const createdDesignationId = toOptionId(createdDesignation?._id || createdDesignation?.id);
      if (isCreateFlow) {
        setCreateForm((previous) => ({
          ...previous,
          department: selectedDepartment.name,
          designation: createdDesignationId,
        }));
        setCreateDesignationDraft('');
      } else {
        setEditForm((previous) => ({
          ...previous,
          department: selectedDepartment.name,
          designation: createdDesignationId,
        }));
        setEditDesignationDraft('');
      }

      setBanner({
        type: 'success',
        text: `Designation ${designationDraft} created for ${selectedDepartment.name}.`,
      });
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to create designation for department') });
    } finally {
      setDesignationCreateLoading('');
    }
  };

  const beginEditEmployee = useCallback(async (employee) => {
    setEditOpen(true);
    setEditProfileLoading(true);
    setEditingEmployeeId(employee.id);
    setBanner({ type: '', text: '' });

    try {
      const profile = await fetchEmployeeProfile(employee.id);

      const rawDesignation = toOptionId(profile?.designation || employee.designation);
      const normalizedDesignationName = normalizeText(profile?.designation || employee.designationLabel || employee.designation);
      const resolvedDesignationId = designationNameById.has(rawDesignation)
        ? rawDesignation
        : designationIdByName.get(normalizedDesignationName) || '';

      const manager = profile?.managerID || profile?.managerId || null;
      const managerName = manager
        ? [manager.firstName, manager.lastName].filter(Boolean).join(' ').trim() || manager.email || 'N/A'
        : 'Not assigned';

      setEditingEmployeeMeta({
        employeeCode: profile?.employeeCode || 'N/A',
        managerName,
        status: profile?.isActive === false ? 'Inactive' : 'Active',
      });

      setEditOriginalDesignationId(resolvedDesignationId);
      setEditForm({
        firstName: profile?.firstName || employee.firstName || '',
        lastName: profile?.lastName || employee.lastName || '',
        email: profile?.email || employee.email || '',
        phoneNumber: profile?.phoneNumber || profile?.phone || employee.phone || '',
        managerId: toOptionId(manager?._id || manager?.id || profile?.managerId || profile?.managerID || ''),
        department: profile?.department || employee.department || '',
        designation: resolvedDesignationId,
        salary: profile?.salary === undefined || profile?.salary === null ? '' : String(profile.salary),
        joinDate: profile?.joinDate ? String(profile.joinDate).slice(0, 10) : employee.joinDate ? String(employee.joinDate).slice(0, 10) : '',
        dateOfBirth: profile?.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '',
        city: profile?.city || profile?.address?.city || '',
        state: profile?.state || profile?.address?.state || '',
        zipCode: profile?.zipCode || profile?.address?.zipCode || '',
        addressLine: profile?.addressLine || profile?.address?.street || '',
        emergencyContactName: profile?.emergencyContact?.name || '',
        emergencyContactRelation: profile?.emergencyContact?.relation || '',
        emergencyContactPhone: profile?.emergencyContact?.phone || '',
      });
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to load full employee details') });
      setEditOpen(false);
      resetEditForm();
    } finally {
      setEditProfileLoading(false);
    }
  }, [designationIdByName, designationNameById, resetEditForm]);

  const submitEditEmployee = async (event) => {
    event.preventDefault();
    if (!editingEmployeeId) {
      return;
    }

    setEditLoading(true);
    setBanner({ type: '', text: '' });

    try {
      const payload = {
        firstName: String(editForm.firstName || '').trim(),
        lastName: String(editForm.lastName || '').trim(),
        email: String(editForm.email || '').trim().toLowerCase(),
        phoneNumber: String(editForm.phoneNumber || '').trim(),
        department: String(editForm.department || '').trim(),
        city: String(editForm.city || '').trim(),
        state: String(editForm.state || '').trim(),
        zipCode: String(editForm.zipCode || '').trim(),
        addressLine: String(editForm.addressLine || '').trim(),
      };

      const normalizedManagerId = String(editForm.managerId || '').trim();
      payload.managerId = normalizedManagerId || null;
      payload.managerID = normalizedManagerId || null;

      const normalizedSalary = String(editForm.salary || '').trim();
      if (normalizedSalary) {
        payload.salary = Number(normalizedSalary);
      }

      const normalizedJoinDate = String(editForm.joinDate || '').trim();
      if (normalizedJoinDate) {
        payload.joinDate = normalizedJoinDate;
      }

      const normalizedDob = String(editForm.dateOfBirth || '').trim();
      if (normalizedDob) {
        payload.dateOfBirth = normalizedDob;
      }

      const emergencyContactName = String(editForm.emergencyContactName || '').trim();
      const emergencyContactRelation = String(editForm.emergencyContactRelation || '').trim();
      const emergencyContactPhone = String(editForm.emergencyContactPhone || '').trim();
      if (emergencyContactName || emergencyContactRelation || emergencyContactPhone) {
        payload.emergencyContact = {
          name: emergencyContactName,
          relation: emergencyContactRelation,
          phone: emergencyContactPhone,
        };
      }

      await updateAdminEmployee(editingEmployeeId, payload);

      const normalizedDesignationId = toOptionId(editForm.designation);
      if (normalizedDesignationId && normalizedDesignationId !== editOriginalDesignationId) {
        await assignEmployeeDesignation(normalizedDesignationId, {
          employeeId: editingEmployeeId,
          effectiveDate: normalizedJoinDate || undefined,
          reason: 'PROFILE_UPDATE',
        });
      }

      setBanner({ type: 'success', text: 'Employee information updated successfully.' });
      setEditOpen(false);
      resetEditForm();
      await loadEmployees();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to update employee') });
    } finally {
      setEditLoading(false);
    }
  };

  const submitCreateEmployee = async (event) => {
    event.preventDefault();
    setCreateLoading(true);
    setBanner({ type: '', text: '' });

    try {
      const result = await createAdminEmployee(createForm);
      const temporaryPassword = String(
        result?.temporaryPassword
        ?? result?.data?.temporaryPassword
        ?? '',
      ).trim();
      const loginAccountCreated = result?.loginAccountCreated ?? result?.data?.loginAccountCreated;

      resetCreateForm();
      await loadEmployees();

      setCreateSuccessInfo({
        temporaryPassword,
        loginAccountCreated: loginAccountCreated !== false,
      });
      if (temporaryPassword) {
        setLastTempPassword(temporaryPassword);
      } else {
        setLastTempPassword('');
      }

      setBanner({
        type: 'success',
        text: temporaryPassword
          ? 'Employee account created. Copy the temporary password below before you close the dialog.'
          : 'Employee account created successfully.',
      });
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to create employee') });
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleEmployeeStatus = async (employee) => {
    if (!employee?.id) {
      return;
    }

    const nextActive = employee.status !== 'active';
    setActionLoading(`status-${employee.id}`);
    setBanner({ type: '', text: '' });

    try {
      await updateEmployeeStatus(employee.id, nextActive);
      setBanner({
        type: 'success',
        text: nextActive
          ? `${employee.name} activated successfully.`
          : `${employee.name} deactivated successfully.`,
      });
      await loadEmployees();
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to update employee status') });
    } finally {
      setActionLoading('');
    }
  };

  const handleResetPassword = async (employee) => {
    if (!employee?.id) {
      return;
    }

    setActionLoading(`reset-${employee.id}`);
    setBanner({ type: '', text: '' });
    setLastTempPassword('');

    try {
      const result = await resetEmployeePassword(employee.id);
      const temporaryPassword = result.temporaryPassword || '';
      setLastTempPassword(temporaryPassword);
      setBanner({
        type: 'success',
        text: temporaryPassword
          ? `Temporary password for ${employee.name}: ${temporaryPassword}`
          : `Password reset successful for ${employee.name}.`,
      });
    } catch (error) {
      setBanner({ type: 'error', text: toErrorMessage(error, 'Failed to reset password') });
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 p-5 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900 md:text-3xl">
              <FiUser size={24} /> User Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              Manage employee accounts, credential resets, and activation controls from the familiar card-based workspace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEmployees}
              disabled={loading}
              className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <FiRefreshCw size={14} /> Refresh
              </span>
            </button>
            <button
              onClick={() => {
                resetCreateForm();
                setCreateSuccessInfo(null);
                setCreateOpen(true);
              }}
              className="h-9 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
            >
              <span className="inline-flex items-center gap-2">
                <FiPlus size={14} /> Add Employee
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-1.5 text-[11px] text-slate-500">{card.note}</p>
                </div>
                <div className={`rounded-xl border px-2.5 py-2.5 ${card.tone}`}>
                  <Icon size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {banner.text && (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm flex items-center justify-between gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${
            banner.type === 'success'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {banner.type === 'success' ? <FiCheckCircle size={16} /> : <FiXCircle size={16} />}
            {banner.text}
          </span>
          <button
            onClick={() => {
              setBanner({ type: '', text: '' });
              setLastTempPassword('');
            }}
            className="text-xs font-semibold opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] md:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, department, or designation"
              className="h-10 w-full rounded-xl border border-slate-300 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {availableDepartmentFilters.map((department) => (
              <option key={department} value={department}>
                {department === 'all' ? 'All departments' : department}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-500 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          Loading user accounts...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <FiUsers size={22} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No users found</h2>
          <p className="mt-2 text-sm text-slate-500">
            Adjust the search or department filter, or add a new employee account.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-colors hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                    {getInitials(employee.name)}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{employee.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{employee.designationLabel}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${employee.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                  {employee.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {employee.department}
                </span>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {employee.role}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                  <FiMail size={15} className="text-slate-400" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                  <FiPhone size={15} className="text-slate-400" />
                  <span>{employee.phone || 'Phone not available'}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                  <FiBriefcase size={15} className="text-slate-400" />
                  <span>{employee.designationLabel}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                  <FiCalendar size={15} className="text-slate-400" />
                  <span>Joined {formatJoinDate(employee.joinDate)}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <button
                  onClick={() => beginEditEmployee(employee)}
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <FiEdit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleResetPassword(employee)}
                  disabled={actionLoading === `reset-${employee.id}`}
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <FiKey size={14} />
                  {actionLoading === `reset-${employee.id}` ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => toggleEmployeeStatus(employee)}
                  disabled={actionLoading === `status-${employee.id}`}
                  className={`h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${employee.status === 'active' ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                  {employee.status === 'active' ? <FiUserX size={14} /> : <FiUserCheck size={14} />}
                  {actionLoading === `status-${employee.id}`
                    ? employee.status === 'active' ? 'Deactivating...' : 'Activating...'
                    : employee.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 px-3 py-6 sm:px-6">
          <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Create Employee Account</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Use the existing HR masters data for department and designation assignment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    resetCreateForm();
                    setCreateSuccessInfo(null);
                    setCopiedCreatePassword(false);
                  }}
                  className="h-8 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              {createSuccessInfo ? (
                <div className="px-5 py-6">
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-900">
                    <p className="font-semibold text-green-950">Account created</p>
                    {createSuccessInfo.temporaryPassword ? (
                      <>
                        <p className="mt-2 text-xs text-green-800">
                          Share this temporary password with the employee. They must change it on first login.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-2.5">
                          <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900">
                            {createSuccessInfo.temporaryPassword}
                          </code>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(createSuccessInfo.temporaryPassword);
                                setCopiedCreatePassword(true);
                                setTimeout(() => setCopiedCreatePassword(false), 1500);
                              } catch {
                                setCopiedCreatePassword(false);
                              }
                            }}
                            className={`shrink-0 text-xs font-semibold ${copiedCreatePassword ? 'text-green-700' : 'text-blue-700 hover:text-blue-900'}`}
                          >
                            {copiedCreatePassword ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-green-800">
                        {createSuccessInfo.loginAccountCreated === false
                          ? 'Employee record was created. No login account was generated, so no temporary password applies.'
                          : 'Employee account was saved. Temporary password was not returned by the server; use Reset Password if needed.'}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setCreateOpen(false);
                        resetCreateForm();
                        setCreateSuccessInfo(null);
                        setCopiedCreatePassword(false);
                      }}
                      className="h-9 rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white hover:bg-blue-800"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
              <form onSubmit={submitCreateEmployee}>
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                  <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
                    A temporary password will be generated automatically after the account is created.
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">First Name*</label>
                      <input required value={createForm.firstName} onChange={setCreateValue('firstName')} placeholder="First name" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Middle Name</label>
                      <input value={createForm.middleName} onChange={setCreateValue('middleName')} placeholder="Middle name (optional)" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Last Name*</label>
                      <input required value={createForm.lastName} onChange={setCreateValue('lastName')} placeholder="Last name" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Work Email*</label>
                      <input required type="email" value={createForm.email} onChange={setCreateValue('email')} placeholder="name@ispace.com" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Department*</label>
                      <select value={createForm.department} onChange={setCreateValue('department')} disabled={referenceLoading} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500">
                        <option value="">Select department</option>
                        {departmentOptions.map((department) => (
                          <option key={department.id} value={department.name}>{department.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Designation*</label>
                      <select value={createForm.designation} onChange={setCreateValue('designation')} disabled={referenceLoading || designationLookupLoading || createDesignationOptions.length === 0} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500">
                        <option value="">{referenceLoading || designationLookupLoading ? 'Checking designations...' : createDesignationOptions.length === 0 ? 'No designations available' : 'Select designation'}</option>
                        {createDesignationOptions.map((designation) => (
                          <option key={designation.id} value={designation.id}>
                            {designation.name}{designation.departmentName ? ` (${designation.departmentName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Salary</label>
                      <input value={createForm.salary} onChange={setCreateValue('salary')} placeholder="Salary" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Join Date</label>
                      <input type="date" value={createForm.joinDate} onChange={setCreateValue('joinDate')} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number*</label>
                      <input value={createForm.phoneNumber} onChange={setCreateValue('phoneNumber')} placeholder="Phone (10 digits)" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Manager Name</label>
                      <input value={createForm.managerName} onChange={setCreateValue('managerName')} placeholder="Manager name" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Manager Email</label>
                      <input type="email" value={createForm.managerEmail} onChange={setCreateValue('managerEmail')} placeholder="manager@ispace.com" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Account Role</label>
                      <select value={createForm.accountRole} onChange={setCreateValue('accountRole')} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="HR_ADMIN">HR_ADMIN</option>
                      </select>
                    </div>
                  </div>

                  {createForm.department && !designationLookupLoading && createDesignationOptions.length === 0 && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-800">
                        No designation found in backend for {createForm.department}. Add one now for this department.
                      </p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={createDesignationDraft}
                          onChange={(event) => setCreateDesignationDraft(event.target.value)}
                          placeholder="Enter designation name"
                          className="h-9 flex-1 rounded-lg border border-amber-300 bg-white px-3 text-xs text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => addDesignationForDepartment('create')}
                          disabled={designationCreateLoading === 'create'}
                          className="h-9 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                          {designationCreateLoading === 'create' ? 'Adding...' : 'Add Designation'}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="mt-3 text-[11px] text-slate-500">
                    Select a department first to narrow the designation list to valid options from HR Masters.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200 px-5 py-3.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateOpen(false);
                      resetCreateForm();
                      setCreateSuccessInfo(null);
                      setCopiedCreatePassword(false);
                    }}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="h-9 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {createLoading ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 px-3 py-6 sm:px-6">
          <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Edit Employee Information</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Update employee details and designation assignments from the same workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditOpen(false);
                    resetEditForm();
                  }}
                  className="h-8 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <form onSubmit={submitEditEmployee}>
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
                  {editProfileLoading ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      Loading complete employee details...
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] text-slate-500">Employee Code</p>
                          <p className="mt-1 text-xs font-semibold text-slate-800">{editingEmployeeMeta.employeeCode || 'N/A'}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] text-slate-500">Manager</p>
                          <p className="mt-1 text-xs font-semibold text-slate-800">{editingEmployeeMeta.managerName || 'Not assigned'}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] text-slate-500">Status</p>
                          <p className="mt-1 text-xs font-semibold text-slate-800">{editingEmployeeMeta.status || 'Active'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">First Name</label>
                          <input required value={editForm.firstName} onChange={setEditValue('firstName')} placeholder="First name" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Last Name</label>
                          <input required value={editForm.lastName} onChange={setEditValue('lastName')} placeholder="Last name" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Work Email</label>
                          <input required type="email" value={editForm.email} onChange={setEditValue('email')} placeholder="name@ispace.com" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                          <input value={editForm.phoneNumber} onChange={setEditValue('phoneNumber')} placeholder="Phone (10 digits)" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Reporting Manager</label>
                          <input
                            value={managerSearchQuery}
                            onChange={(event) => setManagerSearchQuery(event.target.value)}
                            placeholder="Search by manager name, email, department, or designation"
                            className="mb-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                          <select
                            value={editForm.managerId}
                            onChange={setEditValue('managerId')}
                            disabled={managerOptionsLoading}
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                          >
                            <option value="">
                              {managerOptionsLoading ? 'Loading employees...' : 'No manager assigned'}
                            </option>
                            {filteredManagerOptions.map((managerOption) => (
                              <option key={managerOption.id} value={managerOption.id}>
                                {managerOption.name} - {managerOption.designation} ({managerOption.department})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Join Date</label>
                          <input type="date" value={editForm.joinDate} onChange={setEditValue('joinDate')} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth</label>
                          <input type="date" value={editForm.dateOfBirth} onChange={setEditValue('dateOfBirth')} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                          <select value={editForm.department} onChange={setEditValue('department')} disabled={referenceLoading} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500">
                            <option value="">Select department</option>
                            {departmentOptions.map((department) => (
                              <option key={department.id} value={department.name}>{department.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Designation</label>
                          <select value={editForm.designation} onChange={setEditValue('designation')} disabled={referenceLoading || designationLookupLoading || editDesignationOptions.length === 0} className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500">
                            <option value="">{referenceLoading || designationLookupLoading ? 'Checking designations...' : editDesignationOptions.length === 0 ? 'No designations available' : 'Select designation'}</option>
                            {editDesignationOptions.map((designation) => (
                              <option key={designation.id} value={designation.id}>
                                {designation.name}{designation.departmentName ? ` (${designation.departmentName})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Salary</label>
                          <input value={editForm.salary} onChange={setEditValue('salary')} placeholder="Salary" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                          <input value={editForm.city} onChange={setEditValue('city')} placeholder="City" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
                          <input value={editForm.state} onChange={setEditValue('state')} placeholder="State" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Zip Code</label>
                          <input value={editForm.zipCode} onChange={setEditValue('zipCode')} placeholder="Zip code" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Address Line</label>
                          <input value={editForm.addressLine} onChange={setEditValue('addressLine')} placeholder="Address line" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Emergency Contact Name</label>
                          <input value={editForm.emergencyContactName} onChange={setEditValue('emergencyContactName')} placeholder="Emergency contact name" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Emergency Contact Relation</label>
                          <input value={editForm.emergencyContactRelation} onChange={setEditValue('emergencyContactRelation')} placeholder="Emergency contact relation" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Emergency Contact Phone</label>
                          <input value={editForm.emergencyContactPhone} onChange={setEditValue('emergencyContactPhone')} placeholder="Emergency contact phone" className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        </div>
                      </div>

                      {editForm.department && !designationLookupLoading && editDesignationOptions.length === 0 && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-medium text-amber-800">
                            No designation found in backend for {editForm.department}. Add one now for this department.
                          </p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <input
                              value={editDesignationDraft}
                              onChange={(event) => setEditDesignationDraft(event.target.value)}
                              placeholder="Enter designation name"
                              className="h-9 flex-1 rounded-lg border border-amber-300 bg-white px-3 text-xs text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => addDesignationForDepartment('edit')}
                              disabled={designationCreateLoading === 'edit'}
                              className="h-9 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {designationCreateLoading === 'edit' ? 'Adding...' : 'Add Designation'}
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="mt-3 text-[11px] text-slate-500">
                        Designation updates are assigned through the official designation workflow.
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-2.5 border-t border-slate-200 px-5 py-3.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditOpen(false);
                      resetEditForm();
                    }}
                    className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading || editProfileLoading}
                    className="h-9 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {lastTempPassword && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <p className="font-medium text-slate-800">Latest temporary password (copy and share securely)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <code className="min-w-0 flex-1 break-all font-mono text-sm text-slate-900">{lastTempPassword}</code>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(lastTempPassword);
                } catch {
                  /* ignore */
                }
              }}
              className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-slate-500">Ask the user to change this password on first login.</p>
        </div>
      )}
    </div>
  );
};

export default HRUserManagement;

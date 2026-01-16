import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface FuzzySearchOptions {
  query: string;
  departmentId?: string;
  status?: string;
  managerId?: string;
  location?: string;
  legalEntityId?: string;
  page?: number;
  perPage?: number;
}

interface FuzzySearchResult {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  location: string | null;
  departmentId: string | null;
  departmentName: string | null;
  positionId: string | null;
  positionTitle: string | null;
  managerId: string | null;
  managerName: string | null;
  managerAvatarUrl: string | null;
  similarity: number;
  // Extended fields for expandable card
  birthDate: string | null;
  startDate: string | null;
  mattermostUsername: string | null;
  telegramHandle: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactEmail: string | null;
  isManager: boolean;
}

/**
 * Performs fuzzy search on employees using PostgreSQL pg_trgm extension.
 * Searches across fullName, email, position title, and department name.
 * Returns results ranked by similarity score.
 */
export async function fuzzySearchEmployees(options: FuzzySearchOptions) {
  const {
    query,
    departmentId,
    status,
    managerId,
    location,
    legalEntityId,
    page = 1,
    perPage = 12,
  } = options;

  const offset = (page - 1) * perPage;
  const searchTerm = query.trim();

  // Build WHERE conditions
  const conditions: string[] = ["e.status != 'TERMINATED'"];
  const params: any[] = [];
  let paramIndex = 1;

  if (departmentId) {
    conditions.push(`e.department_id = $${paramIndex}::uuid`);
    params.push(departmentId);
    paramIndex++;
  }

  if (status) {
    conditions.push(`e.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (managerId) {
    conditions.push(`e.manager_id = $${paramIndex}::uuid`);
    params.push(managerId);
    paramIndex++;
  }

  if (location) {
    conditions.push(`e.location ILIKE $${paramIndex}`);
    params.push(`%${location}%`);
    paramIndex++;
  }

  if (legalEntityId) {
    conditions.push(`e.legal_entity_id = $${paramIndex}::uuid`);
    params.push(legalEntityId);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  if (!searchTerm) {
    // No search term - return all with basic ordering
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      WHERE ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        e.id,
        e.email,
        e.full_name as "fullName",
        e.avatar_url as "avatarUrl",
        e.status,
        e.location,
        e.department_id as "departmentId",
        d.name as "departmentName",
        e.position_id as "positionId",
        p.title as "positionTitle",
        e.manager_id as "managerId",
        m.full_name as "managerName",
        m.avatar_url as "managerAvatarUrl",
        1.0 as similarity,
        e.birth_date as "birthDate",
        e.start_date as "startDate",
        e.mattermost_username as "mattermostUsername",
        e.telegram_handle as "telegramHandle",
        e.emergency_contact_name as "emergencyContactName",
        e.emergency_contact_phone as "emergencyContactPhone",
        e.emergency_contact_email as "emergencyContactEmail",
        (EXISTS(SELECT 1 FROM employees dr WHERE dr.manager_id = e.id) OR
         EXISTS(SELECT 1 FROM role_assignments ra WHERE ra.employee_id = e.id AND ra.role = 'MANAGER')) as "isManager"
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE ${whereClause}
      ORDER BY e.full_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const [countResult, employees] = await Promise.all([
      db.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...params),
      db.$queryRawUnsafe<FuzzySearchResult[]>(dataQuery, ...params, perPage, offset),
    ]);

    return {
      employees,
      pagination: {
        page,
        perPage,
        total: Number(countResult[0]?.total || 0),
        totalPages: Math.ceil(Number(countResult[0]?.total || 0) / perPage),
      },
    };
  }

  // Fuzzy search with pg_trgm
  const searchParamIndex = paramIndex;
  params.push(searchTerm);

  const fuzzyCondition = `
    (
      e.full_name % $${searchParamIndex} OR
      e.email % $${searchParamIndex} OR
      COALESCE(p.title, '') % $${searchParamIndex} OR
      COALESCE(d.name, '') % $${searchParamIndex} OR
      e.full_name ILIKE '%' || $${searchParamIndex} || '%' OR
      e.email ILIKE '%' || $${searchParamIndex} || '%'
    )
  `;

  const similarityCalc = `
    GREATEST(
      similarity(e.full_name, $${searchParamIndex}),
      similarity(e.email, $${searchParamIndex}),
      similarity(COALESCE(p.title, ''), $${searchParamIndex}),
      similarity(COALESCE(d.name, ''), $${searchParamIndex})
    )
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE ${whereClause} AND ${fuzzyCondition}
  `;

  const dataQuery = `
    SELECT 
      e.id,
      e.email,
      e.full_name as "fullName",
      e.avatar_url as "avatarUrl",
      e.status,
      e.location,
      e.department_id as "departmentId",
      d.name as "departmentName",
      e.position_id as "positionId",
      p.title as "positionTitle",
      e.manager_id as "managerId",
      m.full_name as "managerName",
      m.avatar_url as "managerAvatarUrl",
      ${similarityCalc} as similarity,
      e.birth_date as "birthDate",
      e.start_date as "startDate",
      e.mattermost_username as "mattermostUsername",
      e.telegram_handle as "telegramHandle",
      e.emergency_contact_name as "emergencyContactName",
      e.emergency_contact_phone as "emergencyContactPhone",
      e.emergency_contact_email as "emergencyContactEmail",
      (EXISTS(SELECT 1 FROM employees dr WHERE dr.manager_id = e.id) OR
       EXISTS(SELECT 1 FROM role_assignments ra WHERE ra.employee_id = e.id AND ra.role = 'MANAGER')) as "isManager"
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN employees m ON e.manager_id = m.id
    WHERE ${whereClause} AND ${fuzzyCondition}
    ORDER BY similarity DESC, e.full_name ASC
    LIMIT $${searchParamIndex + 1} OFFSET $${searchParamIndex + 2}
  `;

  params.push(perPage, offset);

  const [countResult, employees] = await Promise.all([
    db.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...params.slice(0, -2)),
    db.$queryRawUnsafe<FuzzySearchResult[]>(dataQuery, ...params),
  ]);

  return {
    employees,
    pagination: {
      page,
      perPage,
      total: Number(countResult[0]?.total || 0),
      totalPages: Math.ceil(Number(countResult[0]?.total || 0) / perPage),
    },
  };
}

/**
 * Get unique locations for filter dropdown
 */
export async function getUniqueLocations(): Promise<string[]> {
  const result = await db.$queryRaw<{ location: string }[]>`
    SELECT DISTINCT location 
    FROM employees 
    WHERE location IS NOT NULL AND location != '' AND status != 'TERMINATED'
    ORDER BY location ASC
  `;
  return result.map(r => r.location);
}

/**
 * Get managers for filter dropdown
 */
export async function getManagers() {
  return db.employee.findMany({
    where: {
      status: { not: "TERMINATED" },
      directReports: { some: {} },
    },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: { fullName: "asc" },
  });
}

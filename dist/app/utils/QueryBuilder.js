// T = Model Type
export class QueryBuilder {
    model;
    queryParams;
    config;
    query;
    countQuery;
    page = 1;
    limit = 10;
    skip = 0;
    sortBy = "createdAt";
    sortOrder = "desc";
    selectFields;
    constructor(model, queryParams, config = {}) {
        this.model = model;
        this.queryParams = queryParams;
        this.config = config;
        this.query = {
            where: {},
            include: {},
            orderBy: {},
            skip: 0,
            take: 10,
        };
        this.countQuery = {
            where: {},
        };
    }
    search() {
        const { searchTerm } = this.queryParams;
        const { searchableFields, searchableExactFields, searchableArrayFields, searchableListRelationFields, searchableEnumFields, } = this.config;
        const exactSearchFields = new Set(searchableExactFields ?? []);
        const arraySearchFields = new Set(searchableArrayFields ?? []);
        const listRelationSearchFields = new Set(searchableListRelationFields ?? []);
        // doctorSearchableFields = ['user.name', 'user.email', 'specialties.specialty.title' , 'specialties.specialty.description']
        if (searchTerm && searchableFields && searchableFields.length > 0) {
            const searchConditions = searchableFields
                .map((field) => {
                const enumValues = searchableEnumFields?.[field];
                const normalizedSearchTerm = typeof searchTerm === "string" ? searchTerm.trim().toUpperCase() : "";
                const resolvedExactValue = (() => {
                    if (!exactSearchFields.has(field)) {
                        return searchTerm;
                    }
                    if (!enumValues || enumValues.length === 0) {
                        return searchTerm;
                    }
                    const matchedEnumValue = enumValues.find((value) => value.toUpperCase() === normalizedSearchTerm);
                    return matchedEnumValue ?? null;
                })();
                if (exactSearchFields.has(field) && resolvedExactValue === null) {
                    return null;
                }
                // Prisma scalar list fields (e.g. String[]) do not support `contains`.
                if (arraySearchFields.has(field)) {
                    return {
                        [field]: {
                            has: searchTerm,
                        },
                    };
                }
                if (field.includes(".")) {
                    const parts = field.split(".");
                    if (parts.length === 2) {
                        const [relation, nestedField] = parts;
                        const filterValue = exactSearchFields.has(field)
                            ? { equals: resolvedExactValue }
                            : {
                                contains: searchTerm,
                                mode: "insensitive",
                            };
                        if (listRelationSearchFields.has(field)) {
                            return {
                                [relation]: {
                                    some: {
                                        [nestedField]: filterValue,
                                    },
                                },
                            };
                        }
                        return {
                            [relation]: {
                                [nestedField]: filterValue,
                            },
                        };
                    }
                    else if (parts.length === 3) {
                        const [relation, nestedRelation, nestedField] = parts;
                        const filterValue = exactSearchFields.has(field)
                            ? { equals: resolvedExactValue }
                            : {
                                contains: searchTerm,
                                mode: "insensitive",
                            };
                        return {
                            [relation]: {
                                some: {
                                    [nestedRelation]: {
                                        [nestedField]: filterValue,
                                    },
                                },
                            },
                        };
                    }
                }
                // direct field
                const filterValue = exactSearchFields.has(field)
                    ? { equals: resolvedExactValue }
                    : {
                        contains: searchTerm,
                        mode: "insensitive",
                    };
                return {
                    [field]: filterValue,
                };
            })
                .filter((condition) => condition !== null);
            if (searchConditions.length === 0) {
                return this;
            }
            const whereConditions = this.query.where;
            whereConditions.OR = searchConditions;
            const countWhereConditions = this.countQuery
                .where;
            countWhereConditions.OR = searchConditions;
        }
        return this;
    }
    // /doctors?searchTerm=john&page=1&sortBy=name&specialty=cardiology&appointmentFee[lt]=100 => {}
    // { specialty: 'cardiology', appointmentFee: { lt: '100' } }
    filter() {
        const { filterableFields, filterableListRelationFields } = this.config;
        const listRelationFilterFields = new Set(filterableListRelationFields ?? []);
        const excludedField = [
            "searchTerm",
            "page",
            "limit",
            "sortBy",
            "sortOrder",
            "fields",
            "include",
        ];
        const filterParams = {};
        Object.keys(this.queryParams).forEach((key) => {
            if (!excludedField.includes(key)) {
                filterParams[key] = this.queryParams[key];
            }
        });
        const queryWhere = this.query.where;
        const countQueryWhere = this.countQuery.where;
        Object.keys(filterParams).forEach((key) => {
            const value = filterParams[key];
            if (value === undefined || value === "") {
                return;
            }
            const isAllowedField = !filterableFields ||
                filterableFields.length === 0 ||
                filterableFields.includes(key);
            // doctorFilterableFields = ['specialties.specialty.title', 'appointmentFee']
            // /doctors?appointmentFee[lt]=100&appointmentFee[gt]=50 => { appointmentFee: { lt: '100', gt: '50' } }
            // /doctors?user.name=John => { user: { name: 'John' } }
            if (key.includes(".")) {
                const parts = key.split(".");
                if (filterableFields && !filterableFields.includes(key)) {
                    return;
                }
                if (parts.length === 2) {
                    const [relation, nestedField] = parts;
                    if (listRelationFilterFields.has(key)) {
                        queryWhere[relation] = {
                            some: {
                                [nestedField]: this.parseFilterValue(value),
                            },
                        };
                        countQueryWhere[relation] = {
                            some: {
                                [nestedField]: this.parseFilterValue(value),
                            },
                        };
                        return;
                    }
                    if (!queryWhere[relation]) {
                        queryWhere[relation] = {};
                        countQueryWhere[relation] = {};
                    }
                    const queryRelation = queryWhere[relation];
                    const countRelation = countQueryWhere[relation];
                    queryRelation[nestedField] = this.parseFilterValue(value);
                    countRelation[nestedField] = this.parseFilterValue(value);
                    return;
                }
                else if (parts.length === 3) {
                    const [relation, nestedRelation, nestedField] = parts;
                    if (!queryWhere[relation]) {
                        queryWhere[relation] = {
                            some: {},
                        };
                        countQueryWhere[relation] = {
                            some: {},
                        };
                    }
                    const queryRelation = queryWhere[relation];
                    const countRelation = countQueryWhere[relation];
                    if (!queryRelation.some) {
                        queryRelation.some = {};
                    }
                    if (!countRelation.some) {
                        countRelation.some = {};
                    }
                    const querySome = queryRelation.some;
                    const countSome = countRelation.some;
                    if (!querySome[nestedRelation]) {
                        querySome[nestedRelation] = {};
                    }
                    if (!countSome[nestedRelation]) {
                        countSome[nestedRelation] = {};
                    }
                    const queryNestedRelation = querySome[nestedRelation];
                    const countNestedRelation = countSome[nestedRelation];
                    queryNestedRelation[nestedField] = this.parseFilterValue(value);
                    countNestedRelation[nestedField] = this.parseFilterValue(value);
                    return;
                }
            }
            if (!isAllowedField) {
                return;
            }
            // Range filter parsing
            if (typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)) {
                queryWhere[key] = this.parseRangeFilter(value);
                countQueryWhere[key] = this.parseRangeFilter(value);
                return;
            }
            //direct value parsing
            queryWhere[key] = this.parseFilterValue(value);
            countQueryWhere[key] = this.parseFilterValue(value);
        });
        return this;
    }
    paginate() {
        const page = Number(this.queryParams.page) || 1;
        const limit = Number(this.queryParams.limit) || 10;
        this.page = page;
        this.limit = limit;
        this.skip = (page - 1) * limit;
        this.query.skip = this.skip;
        this.query.take = this.limit;
        return this;
    }
    sort() {
        const sortBy = this.queryParams.sortBy || "createdAt";
        const sortOrder = this.queryParams.sortOrder === "asc" ? "asc" : "desc";
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        // /doctors?sortBy=user.name&sortOrder=asc => orderBy: { user: { name: 'asc' } }
        if (sortBy.includes(".")) {
            const parts = sortBy.split(".");
            if (parts.length === 2) {
                const [relation, nestedField] = parts;
                this.query.orderBy = {
                    [relation]: {
                        [nestedField]: sortOrder,
                    },
                };
            }
            else if (parts.length === 3) {
                const [relation, nestedRelation, nestedField] = parts;
                this.query.orderBy = {
                    [relation]: {
                        [nestedRelation]: {
                            [nestedField]: sortOrder,
                        },
                    },
                };
            }
            else {
                this.query.orderBy = {
                    [sortBy]: sortOrder,
                };
            }
        }
        else {
            this.query.orderBy = {
                [sortBy]: sortOrder,
            };
        }
        return this;
    }
    fields() {
        const fieldsParam = this.queryParams.fields;
        // /doctors?fields=id,name,user => select: { id: true, name: true, user: { select: { name: true } } }
        //no nested field selection for now, only direct fields
        if (fieldsParam && typeof fieldsParam === "string") {
            const fieldsArray = fieldsParam?.split(",").map((field) => field.trim());
            this.selectFields = {};
            fieldsArray?.forEach((field) => {
                if (this.selectFields) {
                    this.selectFields[field] = true;
                }
            });
            this.query.select = this.selectFields;
            delete this.query.include;
        }
        return this;
    }
    include(relation) {
        if (this.selectFields) {
            return this;
        }
        //if fields method is, include method will be ignored to prevent conflict between select and include
        this.query.include = {
            ...this.query.include,
            ...relation,
        };
        return this;
    }
    dynamicInclude(includeConfig, defaultInclude) {
        if (this.selectFields) {
            return this;
        }
        const result = {};
        defaultInclude?.forEach((field) => {
            if (includeConfig[field]) {
                result[field] = includeConfig[field];
            }
        });
        const includeParam = this.queryParams.include;
        if (includeParam && typeof includeParam === "string") {
            const requestedRelations = includeParam
                .split(",")
                .map((relation) => relation.trim());
            requestedRelations.forEach((relation) => {
                if (includeConfig[relation]) {
                    result[relation] = includeConfig[relation];
                }
            });
        }
        this.query.include = {
            ...this.query.include,
            ...result,
        };
        return this;
    }
    where(condition) {
        this.query.where = this.deepMerge(this.query.where, condition);
        this.countQuery.where = this.deepMerge(this.countQuery.where, condition);
        return this;
    }
    async execute() {
        const [total, data] = await Promise.all([
            this.model.count(this.countQuery),
            this.model.findMany(this.query),
        ]);
        const totalPages = Math.ceil(total / this.limit);
        return {
            data: data,
            meta: {
                page: this.page,
                limit: this.limit,
                total,
                totalPages,
            },
        };
    }
    async count() {
        return await this.model.count(this.countQuery);
    }
    getQuery() {
        return this.query;
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key])) {
                if (result[key] &&
                    typeof result[key] === "object" &&
                    !Array.isArray(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    parseFilterValue(value) {
        if (value === "true") {
            return true;
        }
        if (value === "false") {
            return false;
        }
        if (typeof value === "string" && !isNaN(Number(value)) && value != "") {
            return Number(value);
        }
        if (Array.isArray(value)) {
            return { in: value.map((item) => this.parseFilterValue(item)) };
        }
        return value;
    }
    parseRangeFilter(value) {
        const rangeQuery = {};
        Object.keys(value).forEach((operator) => {
            const operatorValue = value[operator];
            const parsedValue = typeof operatorValue === "string" && !isNaN(Number(operatorValue))
                ? Number(operatorValue)
                : operatorValue;
            switch (operator) {
                case "lt":
                case "lte":
                case "gt":
                case "gte":
                case "equals":
                case "not":
                case "contains":
                case "startsWith":
                case "endsWith":
                    rangeQuery[operator] = parsedValue;
                    break;
                case "in":
                case "notIn":
                    if (Array.isArray(operatorValue)) {
                        rangeQuery[operator] = operatorValue;
                    }
                    else {
                        rangeQuery[operator] = [parsedValue];
                    }
                    break;
                default:
                    break;
            }
        });
        return Object.keys(rangeQuery).length > 0 ? rangeQuery : value;
    }
}

class APIFeatures {
    constructor(mongooseQuery, expressQueryObject) {
        // Mongoose query is from mongoose model model.find() method
        this.query = mongooseQuery;
        this.queryObj = expressQueryObject;
    }

    filter() {
        const queryObjС = { ...this.queryObj };
        const excludedFields= ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObjС[el]);

        console.log(queryObjС);

        // ############### ADVANCED FILTERING ###############

        let queryStr = JSON.stringify(queryObjС);
        console.log(queryStr);
        queryStr = queryStr.replace(/\b{gte|gt|lte|lt}\b/g, match => `$${match}`);

        this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryObj.sort) {
            const sortByMany = this.queryObj.sort.split(',').join(' ');
            this.query = this.query.sort(sortByMany);
        } else {
            this.query = this.query.sort('-createdAt');
        };

        return this;
    }

    limitFields() {
        if (this.queryObj.fields) {
            const fields = this.queryObj.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = +this.queryObj.page;
        const limit = +this.queryObj.limit;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        
        return this;
    }
}

module.exports = APIFeatures;
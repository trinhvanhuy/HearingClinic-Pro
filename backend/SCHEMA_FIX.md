# Fix HearingReport Schema - Change client from Object to Pointer

## Problem
The `HearingReport.client` field is currently defined as `Object` in Parse schema, but we need it to be `Pointer<Client>`.

## Solution Options

### Option 1: Use Parse Dashboard (Recommended)
1. Open Parse Dashboard: http://localhost:1338/dashboard
2. Login with admin credentials
3. Go to "Schema" → "HearingReport"
4. Find the `client` field
5. Delete the field
6. Add a new field:
   - Name: `client`
   - Type: `Pointer`
   - Target Class: `Client`
7. Save the schema

### Option 2: Use MongoDB directly
If you have MongoDB access, you can update the schema directly:

```bash
# Connect to MongoDB
docker exec -it hearing-clinic-mongo mongosh hearing-clinic-db

# Update schema
db._SCHEMA.updateOne(
  { className: "HearingReport" },
  { 
    $unset: { "fields.client": "" }
  }
)

db._SCHEMA.updateOne(
  { className: "HearingReport" },
  { 
    $set: { 
      "fields.client": {
        type: "Pointer",
        targetClass: "Client"
      }
    }
  }
)
```

### Option 3: Delete and recreate HearingReport class
⚠️ **WARNING: This will delete all HearingReport data!**

Only use this if you don't have important data:
1. Delete all HearingReport records
2. Delete the HearingReport class
3. Create new HearingReport records - Parse will auto-create schema with Pointer


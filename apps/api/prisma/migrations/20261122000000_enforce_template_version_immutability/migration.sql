CREATE OR REPLACE FUNCTION prevent_template_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."id" IS DISTINCT FROM NEW."id"
     OR OLD."templateId" IS DISTINCT FROM NEW."templateId"
     OR OLD."versionNumber" IS DISTINCT FROM NEW."versionNumber"
     OR OLD."schemaVersion" IS DISTINCT FROM NEW."schemaVersion"
     OR OLD."configuration" IS DISTINCT FROM NEW."configuration"
     OR OLD."createdBy" IS DISTINCT FROM NEW."createdBy"
     OR OLD."createdAt" IS DISTINCT FROM NEW."createdAt" THEN
    RAISE EXCEPTION 'DocumentTemplateVersion records are immutable after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "DocumentTemplateVersion_immutable" ON "DocumentTemplateVersion";

CREATE TRIGGER "DocumentTemplateVersion_immutable"
BEFORE UPDATE ON "DocumentTemplateVersion"
FOR EACH ROW EXECUTE FUNCTION prevent_template_version_mutation();

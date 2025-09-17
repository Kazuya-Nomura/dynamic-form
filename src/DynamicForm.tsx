import React, { useState, useCallback } from "react";
import {
  Form,
  Button,
  Accordion,
  ListGroup,
  InputGroup,
  FormControl,
  Row,
  Col,
  Alert,
} from "react-bootstrap";

// Type for the dynamic form data
type DynamicValue =
  | string
  | number
  | boolean
  | DynamicValue[]
  | { [key: string]: DynamicValue };

// Recursive component to render form fields
interface RenderFormProps {
  value: DynamicValue;
  path: string;
  onChange: (newValue: DynamicValue, path: string) => void;
}

const RenderForm: React.FC<RenderFormProps> = ({ value, path, onChange }) => {
  const updateValue = useCallback(
    (newVal: DynamicValue) => onChange(newVal, path),
    [onChange, path]
  );

  if (typeof value === "string") {
    return (
      <Form.Group as={Row} className="mb-3" controlId={`${path}-string`}>
        <Form.Label column sm="3">
          {path}
        </Form.Label>
        <Col sm="9">
          <FormControl
            type="text"
            value={value as string}
            onChange={(e) => updateValue(e.target.value)}
          />
        </Col>
      </Form.Group>
    );
  }

  if (typeof value === "number") {
    return (
      <Form.Group as={Row} className="mb-3" controlId={`${path}-number`}>
        <Form.Label column sm="3">
          {path}
        </Form.Label>
        <Col sm="9">
          <FormControl
            type="number"
            value={value as number}
            onChange={(e) => updateValue(parseFloat(e.target.value) || 0)}
          />
        </Col>
      </Form.Group>
    );
  }

  if (typeof value === "boolean") {
    return (
      <Form.Group as={Row} className="mb-3" controlId={`${path}-boolean`}>
        <Form.Label column sm="3">
          {path}
        </Form.Label>
        <Col sm="9">
          <Form.Check
            type="checkbox"
            label={path}
            checked={value as boolean}
            onChange={(e) => updateValue(e.target.checked)}
          />
        </Col>
      </Form.Group>
    );
  }

  if (Array.isArray(value)) {
    return (
      <Form.Group className="mb-3">
        <Form.Label>{path}</Form.Label>
        <ListGroup>
          {value.map((item, index) => (
            <ListGroup.Item key={index} className="p-2">
              <div>Index {index}:</div>
              <RenderForm
                value={item}
                path={`${path}[${index}]`}
                onChange={onChange}
              />
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Form.Group>
    );
  }

  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    return (
      <Accordion defaultActiveKey="0">
        <Accordion.Item eventKey="0">
          <Accordion.Header>{path}</Accordion.Header>
          <Accordion.Body>
            {keys.map((key) => (
              <RenderForm
                key={key}
                value={value[key]}
                path={`${path}.${key}`}
                onChange={onChange}
              />
            ))}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    );
  }

  return <div>Unsupported type at path: {path}</div>;
};

const JsonFormGenerator: React.FC = () => {
  const [jsonString, setJsonString] = useState<string>("");
  const [formData, setFormData] = useState<DynamicValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParseJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonString);
      setFormData(parsed);
      setError(null);
    } catch (err) {
      setError("Invalid JSON: " + (err as Error).message);
      setFormData(null);
    }
  }, [jsonString]);

  const handleFormChange = useCallback(
    (newValue: DynamicValue, path: string) => {
      // Simple dot-notation update for nested objects/arrays
      const updateNested = (
        obj: DynamicValue,
        p: string,
        val: DynamicValue
      ): DynamicValue => {
        if (typeof obj !== "object" || obj === null) return val;
        const paths = p.split(/\.|\[/);
        let current: any = obj;
        for (let i = 0; i < paths.length - 1; i++) {
          const key = paths[i].replace("]", "");
          if (Array.isArray(current)) {
            current = [...current];
            current[parseInt(key)] = { ...current[parseInt(key)] };
            current = current[parseInt(key)];
          } else {
            current = { ...current };
            current[key] = { ...current[key] };
            current = current[key];
          }
        }
        const lastKey = paths[paths.length - 1].replace("]", "");
        if (Array.isArray(current)) {
          const arr = [...current];
          arr[parseInt(lastKey)] = val;
          return arr;
        } else {
          const objCopy = { ...current };
          objCopy[lastKey] = val;
          return objCopy;
        }
      };

      if (formData) {
        setFormData((prev) => updateNested(prev, path, newValue));
      }
    },
    [formData]
  );

  const handleJsonOutput = useCallback(() => {
    if (formData) {
      console.log(JSON.stringify(formData, null, 2)); // Or use a modal/textarea to show
      // You can add a textarea here to display the updated JSON
    }
  }, [formData]);

  return (
    <div className="container mt-4">
      <Row>
        <Col>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Input JSON Configuration</Form.Label>
              <FormControl
                as="textarea"
                rows={10}
                value={jsonString}
                onChange={(e) => setJsonString(e.target.value)}
                placeholder='Paste your irregular JSON here, e.g., {"name": "test", "nested": {"key": 123}, "arr": ["a", "b"]}'
              />
            </Form.Group>
            <Button variant="primary" onClick={handleParseJson}>
              Parse and Generate Form
            </Button>
          </Form>
        </Col>
      </Row>

      {error && (
        <Row className="mt-3">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {formData && (
        <>
          <Row className="mt-4">
            <Col>
              <h4>Generated Form Preview</h4>
              <RenderForm
                value={formData}
                path="root"
                onChange={handleFormChange}
              />
              <Button
                variant="success"
                onClick={handleJsonOutput}
                className="mt-3"
              >
                Output Updated JSON (to console)
              </Button>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default JsonFormGenerator;

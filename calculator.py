import ast
import operator
import math
from logging_config import logger

class SafeCalculator:
    def __init__(self):
        self.operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.Pow: operator.pow,
            ast.USub: operator.neg,
            ast.UAdd: operator.pos,
        }
        self.functions = {
            'sqrt': math.sqrt,
            'percent': lambda x: x / 100.0
        }

    def evaluate(self, expr: str) -> str:
        if not expr or not expr.strip():
            raise ValueError("Empty input")
        
        # Replace common variations
        expr = expr.replace('^', '**')
        # handle percentage e.g. "10 % of 200" is complex, let's keep it simple
        
        try:
            node = ast.parse(expr, mode='eval')
            result = self._eval(node.body)
            # format result
            if isinstance(result, float) and result.is_integer():
                return str(int(result))
            return str(round(result, 6))
        except ZeroDivisionError:
            raise ValueError("Division by zero")
        except Exception as e:
            logger.error(f"Failed to evaluate {expr}: {str(e)}")
            raise ValueError("Invalid mathematical expression")

    def _eval(self, node):
        if hasattr(ast, 'Num') and isinstance(node, getattr(ast, 'Num')): # <python3.8
            return node.n
        elif hasattr(ast, 'Constant') and isinstance(node, getattr(ast, 'Constant')): # python3.8+
            return node.value
        elif isinstance(node, ast.BinOp):
            return self.operators[type(node.op)](self._eval(node.left), self._eval(node.right))
        elif isinstance(node, ast.UnaryOp):
            return self.operators[type(node.op)](self._eval(node.operand))
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in self.functions:
                return self.functions[node.func.id](self._eval(node.args[0]))
            raise ValueError(f"Unsupported function call")
        else:
            raise ValueError(f"Unsupported expression")

calculator = SafeCalculator()

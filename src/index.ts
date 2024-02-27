import {
  Component,
  DockerCompose,
  DockerComposeService,
  Makefile,
  Project,
  SampleFile,
} from 'projen';

export interface ITerraformComponentOptions {
  dockerComposeFile: DockerCompose;

  makefile: Makefile;

  awsDeploy?: boolean;

  terraformEnvironmentVariables?: { [key: string]: string };

  terraformVarFile?: string;

  terraformContainerVersion?: string;

  artefactDirectory?: string;

  backendConfigArguments?: string[];
}

export class TerraformComponent extends Component {
  /**
   * Docker compose service that is used to run terraform
   */
  public readonly service: DockerComposeService;

  /**
   * Makefile used as the entry point for terraform operations.
   */
  public readonly makefile: Makefile;

  constructor(project: Project, options: ITerraformComponentOptions) {
    super(project);

    project.addGitIgnore('.terraform');

    this.service = generateTerraformService(project, options);

    options.dockerComposeFile.addService('terraform', this.service);

    this.makefile = generateMakeFile(
      project,
      options.backendConfigArguments,
      options.terraformVarFile,
    );

    const terraformTargets = this.makefile.rules
      .map((rule) => rule.targets)
      .flat()
      .filter((target) => target !== 'all');

    options.makefile.addRule({
      targets: terraformTargets.map((target) => target.slice(1)),
      prerequisites: ['% :'],
      recipe: ['docker compose run --rm terraform make _$(*)'],
    });
  }
}

const generateTerraformService = (
  project: Project,
  options: ITerraformComponentOptions,
): DockerComposeService => {
  const terraformContainerDefinition = 'Dockerfile.terraform';

  new SampleFile(project, `./containers/${terraformContainerDefinition}`, {
    sourcePath: `${__dirname}/../sample/containers/${terraformContainerDefinition}`,
  });

  const volumes = [DockerCompose.bindVolume('./terraform', '/app')];

  if (options.artefactDirectory !== undefined) {
    volumes.push(DockerCompose.bindVolume(options.artefactDirectory, '/tmp'));
  }

  return new DockerComposeService('app', {
    imageBuild: {
      context: './containers',
      dockerfile: terraformContainerDefinition,
      args: {
        TERRAFORM_VERSION: options.terraformContainerVersion ?? '1.7',
      },
    },

    environment: options.terraformEnvironmentVariables,
    volumes,
  });
};

const generateMakeFile = (
  project: Project,
  backendConfigArguments: string[] = [],
  varFile?: string,
): Makefile => {
  const varFileArgument =
    varFile !== undefined ? ` -var-file="${varFile}"` : '';

  return new Makefile(project, './terraform/Makefile', {
    rules: [
      {
        targets: ['_init'],
        recipe: [
          backendConfigArguments.reduce(
            (generatedInitCommand, initCommand) =>
              generatedInitCommand + ' \\\n\t\t' + initCommand,
            'terraform init',
          ),
        ],
      },
      {
        targets: ['_plan', '_apply', '_destroy'],
        prerequisites: ['_% :', '_init'],
        recipe: ['terraform $(*)' + varFileArgument],
      },
      {
        targets: ['_tf_fmt'],
        recipe: ['terraform fmt'],
      },
      {
        targets: ['_tf_fmt_check'],
        recipe: ['terraform fmt -check'],
      },
      {
        targets: ['_tf_shell'],
        recipe: ['sh'],
      },
    ],
  });
};

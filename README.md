# abapVersion
Extract version from [abapGit](https://abapgit.org/) repository.

Since the introduction of the version property in the [.abapgit.xml](https://docs.abapgit.org/user-guide/repo-settings/dot-abapgit.html) file, it is not possible to reference a static variable where the version of a repository is stored.

This action will extract from the repository the value of the defined variable.

To work the class/interface referenced in the .abapgit.xml file **must** be in the same repository.

# Usage

## Input

- **token**: Token to use in order to access the repository.
- **repoFullName**: Repository full name. Falls back to the name of the repository where the action is running.
- **branch**: Branch of the repository where the version should be extracted. Falls back to the branch where the action is running.

## Output

- **version**: Value of the version variable.

# Examples

## Get the version of the current repository
```yml
- name: Get current repository version value
  uses: RegestaItalia/abapVersion@main
  id: abapVersion
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
- name: Print repository version
  run: echo ${{ steps.abapVersion.outputs.version }}
```

## Get the version of another repository
```yml
- name: Get abapGit repository version value
  uses: RegestaItalia/abapVersion@main
  id: abapVersion
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    repoFullName: abapGit/abapGit
    branch: main
- name: Print repository version
  run: echo ${{ steps.abapVersion.outputs.version }}
```
